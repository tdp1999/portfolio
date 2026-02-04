/**
 * Base entity interface for all domain entities
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project entity representing portfolio projects
 */
export interface Project extends BaseEntity {
  title: string;
  description: string;
  technologies: string[];
  imageUrl?: string;
  liveUrl?: string;
  sourceUrl?: string;
  featured: boolean;
}

/**
 * Experience entity representing work/professional experience
 */
export interface Experience extends BaseEntity {
  company: string;
  role: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  technologies: string[];
  location?: string;
}

/**
 * BlogPost entity representing blog articles
 */
export interface BlogPost extends BaseEntity {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt?: Date;
  tags: string[];
  published: boolean;
}
