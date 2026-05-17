import { Timestamp } from '@angular/fire/firestore';

export interface StaffModel {
  id: string;
  name: string;
  email: string;
  uid: string | null;
  departmentId: string | null;
  departmentName: string | null;
  grade: string | null;
  gradeAssignments: string[];
  personalBudget: number | null;
  phone: string | null;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
  deletedAt: Timestamp | null;
  deletedByUid: string | null;
}

export interface StaffFormModel {
  name: string;
  email: string;
  departmentId: string | null;
  departmentName: string | null;
  grade: string | null;
  gradeAssignments: string[];
  personalBudget: number | null;
  phone: string | null;
}
