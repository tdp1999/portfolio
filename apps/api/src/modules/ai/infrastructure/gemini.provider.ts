import { ApiError, GenerateContentResponse, GoogleGenAI, Part, Tool } from '@google/genai';

import { AiCallError } from '../application/ai-call.error';
import type { AiPart, AiTool } from '../application/ports/ai-client.port';
import type { AiProviderRequest, AiProviderResponse, IAiProvider } from '../application/ports/ai-provider.port';
import type { AiTokenUsage, AiTrace } from '../domain/ai-usage.types';

/** The Gemini adapter behind `IAiProvider`: one `generateContent` request, no function calling (AI-001). */
export class GeminiProvider implements IAiProvider {
  // --- Constants ---

  /** Long enough for a grounded answer that reads a few pages. */
  private static readonly TIMEOUT_MS = 120_000;
  private static readonly TOOLS: Record<AiTool, Tool> = {
    googleSearch: { googleSearch: {} },
    urlContext: { urlContext: {} },
  };

  readonly name = 'gemini';
  private readonly client: GoogleGenAI | null;

  constructor(apiKey: string | null) {
    this.client = apiKey ? new GoogleGenAI({ apiKey, httpOptions: { timeout: GeminiProvider.TIMEOUT_MS } }) : null;
  }

  async generate(request: AiProviderRequest): Promise<AiProviderResponse> {
    if (!this.client) throw new AiCallError('not-configured', 'GEMINI_API_KEY is not set');
    let response: GenerateContentResponse;
    try {
      response = await this.client.models.generateContent({
        model: request.model,
        contents: [{ role: 'user', parts: request.parts.map(GeminiProvider.toPart) }],
        config: {
          systemInstruction: request.system,
          responseMimeType: 'application/json',
          responseJsonSchema: request.jsonSchema,
          tools: request.tools.map((t) => GeminiProvider.TOOLS[t]),
          maxOutputTokens: request.limits?.maxOutputTokens,
          httpOptions: request.limits?.timeoutMs ? { timeout: request.limits.timeoutMs } : undefined,
        },
      });
    } catch (err) {
      throw GeminiProvider.toCallError(err);
    }

    // An empty text (blocked, cut off) is returned as-is: the client records its tokens with the failure.
    return {
      text: response.text ?? '',
      usage: GeminiProvider.toUsage(response),
      trace: GeminiProvider.toTrace(response),
    };
  }

  // --- Rules ---

  /** Maps an SDK failure to the kind callers act on; a 429 carries the delay Gemini asked for. */
  static toCallError(err: unknown): AiCallError {
    if (err instanceof AiCallError) return err;
    if (err instanceof ApiError) {
      if (err.status === 429)
        return new AiCallError('rate-limited', err.message, GeminiProvider.retryDelayMs(err.message));
      // Overloaded or briefly down: Google says to try again later.
      if (err.status === 503 || err.status === 504) return new AiCallError('unavailable', err.message);
      if (err.status === 401 || err.status === 403 || /API key not valid/i.test(err.message)) {
        return new AiCallError('auth', err.message);
      }
      return new AiCallError('provider', err.message);
    }
    // A request that ran past its timeout is aborted: the model was too slow, so it is worth a retry later.
    if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      return new AiCallError('unavailable', `Timed out: ${err.message}`);
    }
    return new AiCallError('network', err instanceof Error ? err.message : String(err));
  }

  // --- Private ---

  /** Gemini puts `"retryDelay": "23s"` in the error body; null when it is absent. */
  private static retryDelayMs(message: string): number | null {
    const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(message);
    return match ? Math.ceil(Number(match[1]) * 1000) : null;
  }

  private static toPart(part: AiPart): Part {
    if ('text' in part) return { text: part.text };
    if ('fileUri' in part) return { fileData: { fileUri: part.fileUri, mimeType: part.mimeType } };
    return { inlineData: part.inlineData };
  }

  private static toUsage(response: GenerateContentResponse): AiTokenUsage {
    const meta = response.usageMetadata;
    return {
      inputTokens: meta?.promptTokenCount ?? 0,
      outputTokens: meta?.candidatesTokenCount ?? 0,
      thinkingTokens: meta?.thoughtsTokenCount ?? 0,
      cachedTokens: meta?.cachedContentTokenCount ?? 0,
      toolTokens: meta?.toolUsePromptTokenCount ?? 0,
    };
  }

  private static toTrace(response: GenerateContentResponse): AiTrace {
    const candidate = response.candidates?.[0];
    const grounding = candidate?.groundingMetadata;
    return {
      searchQueries: grounding?.webSearchQueries ?? [],
      sources: (grounding?.groundingChunks ?? [])
        .filter((c) => !!c.web?.uri)
        .map((c) => ({ url: c.web?.uri as string, title: c.web?.title ?? null })),
      urls: (candidate?.urlContextMetadata?.urlMetadata ?? []).map((u) => ({
        url: u.retrievedUrl ?? '',
        status: String(u.urlRetrievalStatus ?? 'UNKNOWN'),
      })),
      finishReason: candidate?.finishReason ? String(candidate.finishReason) : null,
    };
  }
}
