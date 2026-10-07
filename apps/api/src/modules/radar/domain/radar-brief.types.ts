import { RadarBriefWriter, RadarWorkStatus } from '@prisma/client';

/** Who wrote a brief: the worker's adapter name and model, as on an enrichment. */
export interface RadarBriefProducer {
  adapter: string;
  model: string;
}

export interface RadarBriefProps {
  id: string;
  /** Null: every source. */
  sourceId: string | null;
  windowFrom: Date;
  windowTo: Date;
  /** Markdown, empty until the worker submits it. */
  body: string;
  /** The analyzed items the window held when the brief was written. */
  itemIds: string[];
  workStatus: RadarWorkStatus;
  leaseExpiresAt: Date | null;
  producer: RadarBriefProducer | null;
  /** AUTO: the server AI writes it in the tick; WORKER: `/radar work brief` does. */
  writer: RadarBriefWriter;
  /** Why an AUTO brief could not be written (it is then DONE with an empty body). */
  error: string | null;
  createdAt: Date;
}

export interface CreateRadarBriefPayload {
  sourceId: string | null;
  windowFrom: Date;
  windowTo: Date;
  writer: RadarBriefWriter;
}
