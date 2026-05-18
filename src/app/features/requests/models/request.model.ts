import { Timestamp } from '@angular/fire/firestore';

export interface AuditEntryModel {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  byUid: string;
  byLabel: string;
  note: string | null;
  timestamp: Timestamp | null;
}

export type BudgetSourceKind = 'department' | 'personal' | 'event';

export interface RequestModel {
  id: string;
  poNumber: string | null;
  requestDate: Timestamp | null;
  fiscalYear: string;

  staffId: string | null;
  staffName: string | null;
  submittedByUid: string;

  budgetSourceKind: BudgetSourceKind;
  departmentId: string | null;
  departmentName: string | null;
  eventId: string | null;
  eventName: string | null;

  vendorId: string;
  vendorName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  categoryCode: string | null;
  itemUrl: string | null;
  notes: string | null;

  statusCode: string;
  approvedByUid: string | null;
  approvedByLabel: string | null;
  approvedAt: Timestamp | null;
  dateOrdered: Timestamp | null;
  dateReceived: Timestamp | null;

  attachmentCount: number;

  active: boolean;
  deletedAt: Timestamp | null;
  deletedByUid: string | null;

  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
}

export interface RequestFormModel {
  budgetSourceKind: BudgetSourceKind;
  departmentId: string | null;
  departmentName: string | null;
  eventId: string | null;
  eventName: string | null;
  vendorId: string;
  vendorName: string;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  categoryCode: string | null;
  itemUrl: string | null;
  notes: string | null;
  staffId: string | null;
  staffName: string | null;
  submittedByUid: string;
  fiscalYear: string;
}

export const BUDGET_SOURCE_OPTIONS: { label: string; value: BudgetSourceKind; icon: string }[] = [
  { label: 'Department',       value: 'department', icon: 'pi pi-sitemap' },
  { label: 'Personal Budget',  value: 'personal',   icon: 'pi pi-user' },
  { label: 'Event',            value: 'event',      icon: 'pi pi-calendar' },
];
