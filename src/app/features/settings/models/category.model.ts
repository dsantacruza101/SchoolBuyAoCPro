export interface CategoryModel {
  id: string;
  code: string;
  label: string;
  color: string;
  sortOrder: number;
  active: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  updatedByUid: string;
  deletedAt: unknown | null;
  deletedByUid: string | null;
}

export interface CategoryFormModel {
  code: string;
  label: string;
  color: string;
  sortOrder: number;
}
