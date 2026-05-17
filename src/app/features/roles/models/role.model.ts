import { Timestamp } from '@angular/fire/firestore';

/**
 * Mirrors the `/schools/{schoolId}/roles/{roleId}` Firestore document shape.
 *
 * System roles (`isSystem: true`) have an immutable `code` and cannot be
 * deleted. The `admin` role additionally cannot drop `roles.manage` from its
 * `capabilities` list — enforced at the component and (later) Cloud Function level.
 */
export interface RoleModel {
  /** Firestore document ID — same as `code` for system roles. */
  id: string;
  /** Stable slug, never changes after creation. Immutable for system roles. */
  code: string;
  /** Human-readable display name shown in the UI. */
  name: string;
  /** Optional description shown in the edit dialog. */
  description: string;
  /** `true` for the five seeded system roles; `false` for custom roles. */
  isSystem: boolean;
  /** Controls display order in the roles table. Lower = higher up. */
  sortOrder: number;
  /** Denormalized count of active memberships using this role. */
  memberCount: number;
  /** Capability strings this role grants. Drives JWT custom claims. */
  capabilities: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
}

/**
 * Payload used when creating or updating a role.
 * Omits server-managed fields (`id`, `memberCount`, timestamps).
 */
export interface RoleFormModel {
  code: string;
  name: string;
  description: string;
  capabilities: string[];
  sortOrder: number;
}
