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
  usage: AiTokenUsage;
  trace: AiTrace;
}

/** One provider's transport. Throws `AiCallError` with the kind already mapped. */
export interface IAiProvider {
  readonly name: string;
  generate(request: AiProviderRequest): Promise<AiProviderResponse>;
}
