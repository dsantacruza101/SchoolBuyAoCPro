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
import { VendorFormModel, VendorModel } from '../models';

/**
 * Data-access service for `/schools/{schoolId}/vendors/`.
 *
 * `spendYTD` is read-only — set to 0 on create and updated only by the
 * rollup Cloud Function. Soft-delete guard against open requests is
 * deferred to US-012.
 */
@Injectable({ providedIn: 'root' })
export class VendorsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/vendors`);
  }

  getAll(): Observable<VendorModel[]> {
    return new Observable<VendorModel[]>((subscriber) => {
      const q = query(this.col, orderBy('name'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as VendorModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async create(form: VendorFormModel): Promise<void> {
    await addDoc(this.col, {
      ...form,
      spendYTD: 0,
      lastOrderAt: null,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
      deletedAt: null,
    });
  }

  async update(id: string, form: Partial<VendorFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/vendors/${id}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  async softDelete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/vendors/${id}`);
    await updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }
}
