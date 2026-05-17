import { Timestamp } from '@angular/fire/firestore';

export type EventKind = 'one_shot' | 'annual';

export interface EventModel {
  id: string;
  name: string;
  kind: EventKind;
  description: string | null;
  fiscalYear: string;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  budget: number;
  ownerStaffId: string | null;
  ownerStaffName: string | null;
  participantIds: string[];
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
  deletedAt: Timestamp | null;
  deletedByUid: string | null;
}

export interface EventFormModel {
  name: string;
  kind: EventKind;
  description: string | null;
  fiscalYear: string;
  startDate: Date | null;
  endDate: Date | null;
  budget: number;
  ownerStaffId: string | null;
  ownerStaffName: string | null;
  participantIds: string[];
}

export const EVENT_KIND_OPTIONS: { label: string; value: EventKind }[] = [
  { label: 'One-shot', value: 'one_shot' },
  { label: 'Annual',   value: 'annual' },
];

export const CURRENT_FISCAL_YEAR = '2025-26';
