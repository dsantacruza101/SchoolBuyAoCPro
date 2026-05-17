import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { CreateInviteDto, InviteModel, UserMembershipModel } from '../models';

/**
 * Data-access service for Users & Access (`/userMemberships` and
 * `/schools/{schoolId}/invites/`).
 *
 * Guardrails (cannot disable last admin) are enforced at the component
 * level; Cloud Functions will enforce them server-side once deployed.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get invitesCol() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/invites`);
  }

  /**
   * Returns a live Observable of all `userMemberships` belonging to this
   * school, ordered by `displayName`.
   */
  getMembers(): Observable<UserMembershipModel[]> {
    return new Observable<UserMembershipModel[]>((subscriber) => {
      const membershipsCol = collection(this.firestore, 'userMemberships');
      const q = query(
        membershipsCol,
        where('schoolId', '==', SCHOOL_ID),
        orderBy('displayName'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const members = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as UserMembershipModel,
          );
          subscriber.next(members);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  /**
   * Returns a live Observable of pending invites for this school.
   */
  getPendingInvites(): Observable<InviteModel[]> {
    return new Observable<InviteModel[]>((subscriber) => {
      const q = query(
        this.invitesCol,
        where('status', '==', 'pending'),
        orderBy('email'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const invites = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as InviteModel,
          );
          subscriber.next(invites);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  /**
   * Changes the role on an existing membership.
   * Both `roleId` (FK) and `roleCode` (denormalized) are written together
   * so Security Rules stay consistent until `syncMembershipClaims` fires.
   *
   * @param membershipId - Firestore document ID (`uid_schoolId`).
   * @param roleId - Role document ID (e.g. `'admin'`).
   * @param roleCode - Denormalized role slug.
   */
  async updateRole(membershipId: string, roleId: string, roleCode: string): Promise<void> {
    const ref = doc(this.firestore, `userMemberships/${membershipId}`);
    await updateDoc(ref, {
      roleId,
      roleCode,
      lastSyncedAt: serverTimestamp(),
    });
  }

  /**
   * Toggles the `active` flag on a membership (soft enable / disable).
   * The caller must verify at least one other admin remains active before
   * calling this with `active: false` on an admin membership.
   *
   * @param membershipId - Firestore document ID.
   * @param active - New active state.
   */
  async setActive(membershipId: string, active: boolean): Promise<void> {
    const ref = doc(this.firestore, `userMemberships/${membershipId}`);
    await updateDoc(ref, { active });
  }

  /**
   * Creates a pending invite in `/schools/{schoolId}/invites/`.
   * A Cloud Function will watch for the invited email's first sign-in
   * and automatically convert this into a `userMembership`.
   *
   * @param dto - The invite payload from the dialog form.
   */
  async invite(dto: CreateInviteDto): Promise<void> {
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    );
    await addDoc(this.invitesCol, {
      email: dto.email.toLowerCase().trim(),
      schoolId: SCHOOL_ID,
      roleId: dto.roleId,
      roleCode: dto.roleCode,
      invitedByUid: this.auth.user()?.uid ?? null,
      expiresAt,
      acceptedAt: null,
      status: 'pending',
    });
  }

  /**
   * Revokes a pending invite by setting its status to `'revoked'`.
   *
   * @param inviteId - Firestore document ID of the invite.
   */
  async revokeInvite(inviteId: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/invites/${inviteId}`);
    await updateDoc(ref, { status: 'revoked' });
  }
}
