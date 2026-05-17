import { DepartmentKind } from '../../departments/models';

export type BudgetHealth = 'healthy' | 'warning' | 'critical';

/** Rollup document written by Cloud Functions — one per dept per school. */
export interface RollupModel {
  id: string;
  departmentId: string;
  annualBudget: number;
  approvedReceived: number;
  ordered: number;
  pending: number;
  committed: number;
  available: number;
  pctCommitted: number;
  health: BudgetHealth;
  recomputedAt: unknown;
}

/** View model that merges a department doc with its rollup (if any). */
export interface DepartmentBudgetRow {
  id: string;
  name: string;
  kind: DepartmentKind;
  annualBudget: number;
  committed: number;
  ordered: number;
  pending: number;
  available: number;
  pctCommitted: number;
  health: BudgetHealth;
  hasRollup: boolean;
}

/** View model for the staff personal-budgets tab. */
export interface StaffBudgetRow {
  id: string;
  name: string;
  departmentName: string | null;
  personalBudget: number;
}

export interface BudgetAdjustForm {
  newAmount: number;
  reason: string;
}
