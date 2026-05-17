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
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { GradeLevelFormModel, GradeLevelModel } from '../models';

/**
 * Data-access service for `/schools/{schoolId}/gradeLevels/`.
 *
 * Uses raw `onSnapshot` instead of AngularFire's `collectionData` to avoid
 * the RC-era "different Firestore instance" error in `@angular/fire 21`.
 */
@Injectable({ providedIn: 'root' })
export class GradeLevelsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/gradeLevels`);
  }

  /**
   * Returns a live Observable of all grade levels ordered by `sortOrder`.
   */
  getAll(): Observable<GradeLevelModel[]> {
    return new Observable<GradeLevelModel[]>((subscriber) => {
      const q = query(this.col, orderBy('sortOrder'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as GradeLevelModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  /**
   * Creates a new grade level document.
   *
   * @param form - The form payload from the create dialog.
   */
  async create(form: GradeLevelFormModel): Promise<void> {
    await addDoc(this.col, {
      ...form,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  /**
   * Updates an existing grade level's editable fields.
   *
   * @param id - Firestore document ID.
   * @param form - Fields to update.
   */
  async update(id: string, form: Partial<GradeLevelFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/gradeLevels/${id}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  /**
   * Atomically persists a new display order via a Firestore WriteBatch.
   * A single batch commit triggers exactly one snapshot, eliminating
   * intermediate states and visual snap-back during drag-and-drop reorder.
   *
   * @param items - Grade levels in their new display order.
   */
  async reorder(items: GradeLevelModel[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    items.forEach((item, index) => {
      const ref = doc(this.firestore, `schools/${SCHOOL_ID}/gradeLevels/${item.id}`);
      batch.update(ref, { sortOrder: (index + 1) * 10 });
    });
    await batch.commit();
  }

  /**
   * Permanently deletes a grade level document.
   *
   * @param id - Firestore document ID.
   */
  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/gradeLevels/${id}`);
    await deleteDoc(ref);
  }
}
