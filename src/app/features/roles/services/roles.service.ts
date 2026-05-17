import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { RoleFormModel, RoleModel } from '../models';

/**
 * Data-access service for `/schools/{schoolId}/roles/`.
 *
 * All writes include `updatedAt` and `updatedByUid` for audit purposes.
 * Guardrails (cannot delete system roles, admin must keep `roles.manage`)
 * are enforced at the component level; this service performs raw Firestore
 * operations and trusts the caller to validate first.
 */
@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get rolesCol() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/roles`);
  }

  /**
   * Returns a live `Observable` of all roles ordered by `sortOrder`.
   * Uses raw `onSnapshot` instead of AngularFire's `collectionData` to avoid
   * the RC-era "different Firestore instance" error in `@angular/fire 21`.
   */
  getAll(): Observable<RoleModel[]> {
    return new Observable<RoleModel[]>((subscriber) => {
      const q = query(this.rolesCol, orderBy('sortOrder'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const roles = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as RoleModel,
          );
          subscriber.next(roles);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  /**
   * Creates a new custom role document.
   *
   * @param form - The role data submitted from the create dialog.
   * @returns A promise that resolves with the new document reference.
   */
  async create(form: RoleFormModel): Promise<void> {
    await addDoc(this.rolesCol, {
      ...form,
      isSystem: false,
      memberCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  /**
   * Updates an existing role's editable fields.
   * `code` and `isSystem` are never included in the update payload — the
   * component strips them before calling this method.
   *
   * @param id - Firestore document ID of the role to update.
   * @param form - Partial role data with the fields to change.
   */
  async update(id: string, form: Partial<RoleFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/roles/${id}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  /**
   * Permanently deletes a role document.
   *
   * Only call this after verifying `!role.isSystem && role.memberCount === 0`.
   * The component enforces these guardrails before reaching this method.
   *
   * @param id - Firestore document ID of the role to delete.
   */
  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/roles/${id}`);
    await deleteDoc(ref);
  }
}
