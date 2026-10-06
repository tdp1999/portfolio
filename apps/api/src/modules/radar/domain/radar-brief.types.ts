import { RadarWorkStatus } from '@prisma/client';

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
  createdAt: Date;
}

export interface CreateRadarBriefPayload {
  sourceId: string | null;
  windowFrom: Date;
  windowTo: Date;
}
