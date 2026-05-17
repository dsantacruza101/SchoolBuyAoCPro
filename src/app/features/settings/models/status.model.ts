export interface StatusModel {
  id: string;
  code: string;
  label: string;
  color: string;
  isTerminal: boolean;
  sortOrder: number;
  isSystem: boolean;
  active: boolean;
  createdAt: unknown;
  updatedAt: unknown;
  updatedByUid: string;
  deletedAt: unknown | null;
  deletedByUid: string | null;
}

export interface StatusFormModel {
  code: string;
  label: string;
  color: string;
  isTerminal: boolean;
  sortOrder: number;
}

export const SYSTEM_STATUSES: Omit<StatusModel, 'id' | 'createdAt' | 'updatedAt' | 'updatedByUid' | 'deletedAt' | 'deletedByUid'>[] = [
  { code: 'pending',       label: 'Pending',       color: '#f59e0b', isTerminal: false, sortOrder: 1, isSystem: true, active: true },
  { code: 'approved',      label: 'Approved',      color: '#10b981', isTerminal: false, sortOrder: 2, isSystem: true, active: true },
  { code: 'auto-approved', label: 'Auto-Approved', color: '#6366f1', isTerminal: false, sortOrder: 3, isSystem: true, active: true },
  { code: 'ordered',       label: 'Ordered',       color: '#3b82f6', isTerminal: false, sortOrder: 4, isSystem: true, active: true },
  { code: 'received',      label: 'Received',      color: '#22c55e', isTerminal: true,  sortOrder: 5, isSystem: true, active: true },
  { code: 'denied',        label: 'Denied',        color: '#ef4444', isTerminal: true,  sortOrder: 6, isSystem: true, active: true },
];
