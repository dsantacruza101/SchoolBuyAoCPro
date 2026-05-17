import { Timestamp } from '@angular/fire/firestore';

/**
 * Mirrors `/userMemberships/{uid}_{schoolId}` — the join document that says
 * "user X has role Y at school Z."
 *
 * `email` and `displayName` are denormalized from `/users/{uid}` so the list
 * view renders without a secondary read per row.
 */
export interface UserMembershipModel {
  /** Firestore document ID — `{uid}_{schoolId}`. */
  id: string;
  uid: string;
  schoolId: string;
  /** FK → `/schools/{schoolId}/roles/{roleId}`. */
  roleId?: string | null;
  /** Denormalized role slug — read by Security Rules, drives JWT claims. */
  roleCode: string;
  /** Denormalized from `/users/{uid}` for display purposes. */
  email: string;
  /** Denormalized from `/users/{uid}` for display purposes. */
  displayName: string;
  photoURL?: string | null;
  /** `false` = soft-disabled; excluded from active-member queries. */
  active: boolean;
  invitedByUid?: string | null;
  joinedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  lastSyncedAt?: Timestamp | null;
}

/**
 * Mirrors `/schools/{schoolId}/invites/{inviteId}` — a pending invitation
 * by email. When the invited person signs in for the first time, a Cloud
 * Function matches by email and converts this into a `userMembership`.
 */
export interface InviteModel {
  /** Firestore document ID. */
  id: string;
  email: string;
  schoolId: string;
  /** FK → `/schools/{schoolId}/roles/{roleId}`. */
  roleId: string;
  /** Denormalized role slug for display in the pending-invites table. */
  roleCode: string;
  invitedByUid: string;
  /** Invite expires 14 days after creation. */
  expiresAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
}

/** Payload submitted from the Invite dialog. */
export interface CreateInviteDto {
  email: string;
  /** The role document ID (e.g. `'admin'`). */
  roleId: string;
  /** Denormalized slug kept alongside roleId for display. */
  roleCode: string;
}
