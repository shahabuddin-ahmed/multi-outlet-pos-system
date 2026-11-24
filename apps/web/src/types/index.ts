// Types that match the API answers (see apps/api). Money is always integer cents.
export interface ApiEnvelope<T> {
  code: string;
  message: string;
  response: T;
  errors: string[];
}

export interface HealthReport {
  service: string;
  status: string;
  database: string;
}

export interface Paged<T> {
  data: T[];
  offset: number;
  limit: number;
  total: number;
}

// Sample feature: removed together with the API's posts
export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostInput {
  title: string;
  content: string;
  author?: string;
}
