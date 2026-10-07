import type { AiBalance, AiModelInfo, AiObservedLimit, AiProviderProfile } from '../../domain/ai-limit.types';
import type { AiTokenUsage, AiTrace } from '../../domain/ai-usage.types';
import type { AiLimits, AiPart, AiTool } from './ai-client.port';

export interface AiProviderRequest {
  model: string;
  system: string;
  parts: AiPart[];
  /** JSON Schema the provider constrains its answer to. */
  jsonSchema: Record<string, unknown>;
  tools: AiTool[];
  limits?: AiLimits;
}

/** The provider's raw answer: text not yet parsed, plus what it reported about the call. */
export interface AiProviderResponse {
  text: string;
  /** False when the provider stopped early (output cap, safety): broken JSON is then expected. */
  complete: boolean;
  usage: AiTokenUsage;
  /** Web search queries the provider ran; 0 when it ran none or has no search tool. */
  searchQueries: number;
  trace: AiTrace;
  /** Limits the response reported (rate-limit headers); empty when the provider sends none. */
  limits: AiObservedLimit[];
}

/**
 * One provider's transport. Throws `AiCallError` with the kind already mapped; a rate-limit error
 * carries the limits the provider named. Adding a provider means one new class of this shape.
 */
export interface IAiProvider {
  readonly profile: AiProviderProfile;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
  /** The model's fixed limits from the provider's metadata. Throws `AiCallError`. */
  getModelInfo(model: string): Promise<AiModelInfo>;
  /** Credit left on the account; null when the provider does not expose it to an API key. */
  getBalance(): Promise<AiBalance | null>;
}
