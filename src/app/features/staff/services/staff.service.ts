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
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { StaffFormModel, StaffModel } from '../models';

/**
 * Data-access service for `/schools/{schoolId}/staff/`.
 *
 * All documents are fetched ordered by name; active filtering is handled
 * in the component so no composite index is required. Soft-delete guard
 * against open requests is deferred to US-012.
 */
@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/staff`);
  }

  getAll(): Observable<StaffModel[]> {
    return new Observable<StaffModel[]>((subscriber) => {
      const q = query(this.col, orderBy('name'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as StaffModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async create(form: StaffFormModel): Promise<void> {
    await addDoc(this.col, {
      ...form,
      uid: null,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
      deletedAt: null,
      deletedByUid: null,
    });
  }

  async update(id: string, form: Partial<StaffFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/staff/${id}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  async softDelete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/staff/${id}`);
    await updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp(),
      deletedByUid: this.auth.user()?.uid ?? null,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }
}
