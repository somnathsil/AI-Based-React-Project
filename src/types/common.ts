export type ThemeMode = 'light' | 'dark' | 'system';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export type StatusType = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
