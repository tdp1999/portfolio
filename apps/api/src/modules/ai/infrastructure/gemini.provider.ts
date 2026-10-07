import { GoogleGenAI, Interactions } from '@google/genai';

import { AiCallError } from '../application/ai-call.error';
import type { AiPart, AiTool } from '../application/ports/ai-client.port';
import type { AiProviderRequest, AiProviderResponse, IAiProvider } from '../application/ports/ai-provider.port';
import type {
  AiBalance,
  AiLimitKind,
  AiLimitWindow,
  AiModelInfo,
  AiObservedLimit,
  AiProviderProfile,
} from '../domain/ai-limit.types';
import type { AiTokenUsage, AiTrace } from '../domain/ai-usage.types';

type Interaction = Awaited<ReturnType<GoogleGenAI['interactions']['create']>>;
type Step = Interactions.Step;

/** One entry of a `google.rpc.QuotaFailure` in a 429 body. */
interface QuotaViolation {
  quotaMetric?: string;
  quotaId?: string;
  quotaDimensions?: { model?: string };
  quotaValue?: string;
}

/**
 * The Gemini adapter behind `IAiProvider`: one Interactions API request, no function calling
 * (AI-001). Interactions, not `generateContent`, because `generateContent` with a JSON schema
 * silently skips Google Search; Interactions runs the search and still returns schema JSON.
 */
export class GeminiProvider implements IAiProvider {
  // --- Constants ---

  /** Long enough for a grounded answer that reads a few pages. */
  private static readonly TIMEOUT_MS = 120_000;
  private static readonly TOOLS: Record<AiTool, Interactions.Tool> = {
    webSearch: { type: 'google_search' },
    readUrls: { type: 'url_context' },
  };
  /** A 400 that is the model's doing, not the request's: worth a later try, not a failure. */
  private static readonly TRANSIENT_400 = /too many tool calls/i;
  private static readonly PRICING_URL = 'https://ai.google.dev/gemini-api/docs/pricing';

  /**
   * Gemini sends no rate-limit headers and does not let an API key read its quota or credit:
   * RPM / TPM / RPD per tier live only on AI Studio. What the app can learn comes from model
   * metadata, 429 bodies and the documented allowances below (checked 2026-10-07 on the pricing page).
   */
  readonly profile: AiProviderProfile = {
    name: 'gemini',
    displayName: 'Google Gemini',
    keyEnv: 'GEMINI_API_KEY',
    reportsRateLimits: false,
    links: {
      pricing: GeminiProvider.PRICING_URL,
      usage: 'https://aistudio.google.com/usage',
      limits: 'https://aistudio.google.com/rate-limit',
    },
    documentedLimits: [
      {
        metric: 'web-search-free-queries',
        label: 'Google Search queries, free allowance (Gemini 3.x)',
        kind: 'web-search-queries',
        window: 'month',
        limit: 5000,
        url: GeminiProvider.PRICING_URL,
        checkedOn: '2026-10-07',
      },
    ],
  };
  private readonly client: GoogleGenAI | null;

  constructor(apiKey: string | null) {
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    if (!this.client) throw new AiCallError('not-configured', 'GEMINI_API_KEY is not set');
    let interaction: Interaction;
    try {
      interaction = await this.client.interactions.create(
        {
          model: request.model,
          system_instruction: request.system,
          input: request.parts.map(GeminiProvider.toContent),
          tools: request.tools.map((t) => GeminiProvider.TOOLS[t]),
          response_format: { type: 'text', mime_type: 'application/json', schema: request.jsonSchema },
          generation_config: {
            max_output_tokens: request.limits?.maxOutputTokens,
            thinking_level: request.limits?.effort,
          },
          store: false,
        },
        // The SDK would retry a 429 on its own; the caller decides retries (leave the work pending).
        { maxRetries: 0, timeout: request.limits?.timeoutMs ?? GeminiProvider.TIMEOUT_MS }
      );
    } catch (err) {
      throw GeminiProvider.toCallError(err);
    }

    const steps = interaction.steps ?? [];
    // An empty text (blocked, cut off) is returned as-is: the client records its tokens with the failure.
    return {
      text: interaction.output_text ?? '',
      complete: interaction.status === 'completed',
      usage: GeminiProvider.toUsage(interaction.usage),
      searchQueries: GeminiProvider.searchQueryCount(steps, interaction.usage),
      trace: GeminiProvider.toTrace(steps, interaction.status ?? null),
      limits: [],
    };
  }

  async getModelInfo(model: string): Promise<AiModelInfo> {
    if (!this.client) throw new AiCallError('not-configured', 'GEMINI_API_KEY is not set');
    try {
      const info = await this.client.models.get({ model });
      return {
        model,
        inputTokenLimit: info.inputTokenLimit ?? null,
        outputTokenLimit: info.outputTokenLimit ?? null,
        thinking: info.thinking ?? null,
      };
    } catch (err) {
      throw GeminiProvider.toCallError(err);
    }
  }

  /** Gemini has no balance endpoint; credit shows only on AI Studio. */
  async getBalance(): Promise<AiBalance | null> {
    return null;
  }

  // --- Rules ---

  /**
   * Maps an SDK failure to the kind callers act on; a 429 carries the delay Gemini asked for.
   * The Interactions client throws its own error classes (not exported), so they are read by
   * `status` and `name`.
   */
  static toCallError(err: unknown): AiCallError {
    if (err instanceof AiCallError) return err;
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : '';
    const status = GeminiProvider.statusOf(err);
    if (status === 429) {
      const retryAfterMs = GeminiProvider.retryDelayMs(message);
      return new AiCallError('rate-limited', message, retryAfterMs, GeminiProvider.quotaLimits(message, retryAfterMs));
    }
    // Overloaded or briefly down: Google says to try again later.
    if (status === 503 || status === 504) return new AiCallError('unavailable', message);
    if (status === 401 || status === 403 || /API key not valid/i.test(message)) return new AiCallError('auth', message);
    if (status === 400 && GeminiProvider.TRANSIENT_400.test(message)) return new AiCallError('unavailable', message);
    if (status !== null) return new AiCallError('provider', message);
    // A request that ran past its timeout is aborted: the model was too slow, so it is worth a retry later.
    if (/Timeout|AbortError/.test(name)) return new AiCallError('unavailable', `Timed out: ${message}`);
    return new AiCallError('network', message);
  }

  /**
   * The quotas a 429 body names, as neutral limits. At that moment nothing is left, so `remaining`
   * is 0; the reset is the retry delay Gemini asked for, when it gave one.
   */
  static quotaLimits(message: string, retryAfterMs: number | null, now = new Date()): AiObservedLimit[] {
    const resetAt = retryAfterMs !== null ? new Date(now.getTime() + retryAfterMs) : null;
    return GeminiProvider.violations(message).flatMap((v) => {
      const metric = v.quotaId ?? v.quotaMetric;
      if (!metric) return [];
      const kind = GeminiProvider.quotaKind(`${metric} ${v.quotaMetric ?? ''}`);
      const window = GeminiProvider.quotaWindow(metric);
      const limit = Number(v.quotaValue);
      return [
        {
          metric,
          label: GeminiProvider.quotaLabel(kind, window, /free.?tier/i.test(metric)),
          kind,
          window,
          model: v.quotaDimensions?.model ?? null,
          limit: Number.isFinite(limit) && limit > 0 ? limit : null,
          remaining: 0,
          resetAt,
          source: 'error' as const,
          observedAt: now,
        },
      ];
    });
  }

  // --- Private ---

  /** The QuotaFailure entries of the JSON body, or the plain-text form when the body is not JSON. */
  private static violations(message: string): QuotaViolation[] {
    const start = message.indexOf('{');
    if (start >= 0) {
      try {
        const body = JSON.parse(message.slice(start)) as { error?: { details?: { violations?: QuotaViolation[] }[] } };
        const found = (body.error?.details ?? []).flatMap((d) => d.violations ?? []);
        if (found.length) return found;
      } catch {
        // Not JSON: fall through to the text form.
      }
    }
    const text = /Quota exceeded for metric: ([^,\s]+), limit: (\d+)(?:, model: ([\w.-]+))?/g;
    return [...message.matchAll(text)].map(([, quotaMetric, quotaValue, model]) => ({
      quotaMetric,
      quotaValue,
      quotaDimensions: model ? { model } : undefined,
    }));
  }

  private static quotaKind(id: string): AiLimitKind {
    if (/input.?token/i.test(id)) return 'input-tokens';
    if (/token/i.test(id)) return 'tokens';
    if (/search|grounding/i.test(id)) return 'web-search-queries';
    if (/request/i.test(id)) return 'requests';
    return 'other';
  }

  private static quotaWindow(id: string): AiLimitWindow | null {
    if (/PerMinute/i.test(id)) return 'minute';
    if (/PerDay/i.test(id)) return 'day';
    if (/PerMonth/i.test(id)) return 'month';
    return null;
  }

  private static quotaLabel(kind: AiLimitKind, window: AiLimitWindow | null, freeTier: boolean): string {
    const what: Record<AiLimitKind, string> = {
      requests: 'Requests',
      'input-tokens': 'Input tokens',
      tokens: 'Tokens',
      'web-search-queries': 'Search queries',
      other: 'Quota',
    };
    return `${what[kind]}${window ? ` per ${window}` : ''}${freeTier ? ' (free tier)' : ''}`;
  }

  private static statusOf(err: unknown): number | null {
    const status = (err as { status?: unknown } | null)?.status;
    return typeof status === 'number' ? status : null;
  }

  /** Gemini puts `"retryDelay": "23s"` in the error body; null when it is absent. */
  private static retryDelayMs(message: string): number | null {
    const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(message);
    return match ? Math.ceil(Number(match[1]) * 1000) : null;
  }

  private static toContent(part: AiPart): Interactions.Content {
    if ('text' in part) return { type: 'text', text: part.text };
    const [mime, source] =
      'fileUri' in part
        ? [part.mimeType, { uri: part.fileUri }]
        : [part.inlineData.mimeType, { data: part.inlineData.data }];
    return { type: GeminiProvider.mediaType(mime ?? ''), mime_type: mime, ...source } as Interactions.Content;
  }

  /** The content block type a file goes in, by its mime type; an unknown or missing one is sent as an image. */
  private static mediaType(mime: string): 'image' | 'video' | 'audio' | 'document' {
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'document';
    return 'image';
  }

  private static toUsage(usage: Interactions.Usage | undefined): AiTokenUsage {
    return {
      inputTokens: usage?.total_input_tokens ?? 0,
      outputTokens: usage?.total_output_tokens ?? 0,
      thinkingTokens: usage?.total_thought_tokens ?? 0,
      cachedTokens: usage?.total_cached_tokens ?? 0,
      toolTokens: usage?.total_tool_use_tokens ?? 0,
    };
  }

  /** Billed per query: the queries the search steps list, or the usage count when it reports more. */
  private static searchQueryCount(steps: Step[], usage: Interactions.Usage | undefined): number {
    const listed = GeminiProvider.searchQueries(steps).length;
    const counted = (usage?.grounding_tool_count ?? [])
      .filter((g) => String(g.type ?? '').includes('search'))
      .reduce((sum, g) => sum + ((g as { search_query_count?: number }).search_query_count ?? g.count ?? 0), 0);
    return Math.max(listed, counted);
  }

  private static searchQueries(steps: Step[]): string[] {
    return steps.flatMap((s) => (s.type === 'google_search_call' ? (s.arguments.queries ?? []) : []));
  }

  private static toTrace(steps: Step[], status: string | null): AiTrace {
    const sources = steps.flatMap((s) =>
      s.type === 'model_output'
        ? (s.content ?? []).flatMap((c) =>
            c.type === 'text'
              ? (c.annotations ?? []).flatMap((a) =>
                  a.type === 'url_citation' && a.url ? [{ url: a.url, title: a.title ?? null }] : []
                )
              : []
          )
        : []
    );
    return {
      searchQueries: GeminiProvider.searchQueries(steps),
      sources,
      urls: steps.flatMap((s) =>
        s.type === 'url_context_result'
          ? s.result.map((r) => ({ url: r.url ?? '', status: r.status ?? 'unknown' }))
          : []
      ),
      finishReason: status,
    };
  }
}
