import { Timestamp } from '@angular/fire/firestore';

export type DepartmentKind = 'subject' | 'admin' | 'admin_sub' | 'system';

export interface DepartmentModel {
  id: string;
  name: string;
  kind: DepartmentKind;
  parentId: string | null;
  annualBudget: number | null;
  ownerStaffId: string | null;
  notes: string | null;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
  deletedAt: Timestamp | null;
  deletedByUid: string | null;
}

export interface DepartmentFormModel {
  name: string;
  kind: DepartmentKind;
  parentId: string | null;
  annualBudget: number | null;
  notes: string | null;
}

export const DEPARTMENT_KIND_OPTIONS: { label: string; value: DepartmentKind }[] = [
  { label: 'Subject', value: 'subject' },
  { label: 'Admin', value: 'admin' },
  { label: 'Admin Sub', value: 'admin_sub' },
  { label: 'System', value: 'system' },
];
