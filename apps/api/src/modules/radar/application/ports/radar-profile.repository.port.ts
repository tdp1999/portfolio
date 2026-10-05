export interface RadarWorkflowProfileData {
  body: string;
  updatedAt: Date;
}

/** The Owner's single workflow profile, the yardstick for each item's "apply to my workflow" note. */
export interface IRadarProfileRepository {
  find(): Promise<RadarWorkflowProfileData | null>;
  upsert(body: string): Promise<RadarWorkflowProfileData>;
}
