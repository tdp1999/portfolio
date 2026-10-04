import { RadarPlatform, RadarSource } from '@prisma/client';

export interface RadarSourceWithCount extends RadarSource {
  itemCount: number;
}

export interface CreateRadarSourceData {
  id: string;
  platform: RadarPlatform;
  url: string;
  displayName: string;
}

export interface IRadarSourceRepository {
  create(data: CreateRadarSourceData): Promise<RadarSourceWithCount>;
  findById(id: string): Promise<RadarSource | null>;
  findByUrl(url: string): Promise<RadarSource | null>;
  findAll(): Promise<RadarSourceWithCount[]>;
  setActive(id: string, isActive: boolean): Promise<void>;
  /** Cascades to the source's runs and items. */
  delete(id: string): Promise<void>;
}
