export type Nullable<T> = T | null;

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
