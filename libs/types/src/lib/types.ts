/**
 * Base entity interface for all domain entities
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
