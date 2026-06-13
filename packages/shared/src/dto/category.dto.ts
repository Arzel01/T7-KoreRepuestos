export interface CategoryResponse {
  id: number;
  name: string;
  parentId?: number | null;
  children?: CategoryResponse[];
}
