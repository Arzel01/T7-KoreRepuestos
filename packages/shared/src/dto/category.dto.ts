export interface CategoryResponse {
  id: number;
  name: string;
  parentId?: number | null;
  children?: CategoryResponse[];
}

export interface CreateCategoryPayload {
  name: string;
  parentId?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  parentId?: number;
}
