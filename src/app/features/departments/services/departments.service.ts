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
import { DepartmentFormModel, DepartmentModel } from '../models';

/**
 * Data-access service for `/schools/{schoolId}/departments/`.
 *
 * Fetches all documents (including soft-deleted) ordered by name; active
 * filtering is handled in the component so no composite index is required.
 */
@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/departments`);
  }

  getAll(): Observable<DepartmentModel[]> {
    return new Observable<DepartmentModel[]>((subscriber) => {
      const q = query(this.col, orderBy('name'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as DepartmentModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async create(form: DepartmentFormModel): Promise<void> {
    await addDoc(this.col, {
      ...form,
      active: true,
      ownerStaffId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
      deletedAt: null,
      deletedByUid: null,
    });
  }

  async update(id: string, form: Partial<DepartmentFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/departments/${id}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  /**
   * Soft-deletes a department by setting `active: false` and stamping
   * `deletedAt` / `deletedByUid`. Hard-delete guard (active requests) is
   * enforced once the Requests feature is implemented (US-012).
   */
  async softDelete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/departments/${id}`);
    await updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp(),
      deletedByUid: this.auth.user()?.uid ?? null,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }
}
