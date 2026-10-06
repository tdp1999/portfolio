import { RadarSource } from '../../domain/entities/radar-source.entity';

/** A source as the Sources dialog lists it. */
export interface RadarSourceListing {
  source: RadarSource;
  itemCount: number;
}

export interface IRadarSourceRepository {
  /** Throws a conflict when another source already has the URL. */
  add(source: RadarSource): Promise<void>;
  findById(id: string): Promise<RadarSource | null>;
  findByUrl(url: string): Promise<RadarSource | null>;
  findAll(): Promise<RadarSourceListing[]>;
  save(source: RadarSource): Promise<void>;
  /** Cascades to the source's runs and items. */
  delete(id: string): Promise<void>;
}
