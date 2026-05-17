import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { CategoryFormModel, CategoryModel } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/categories`);
  }

  getAll(): Observable<CategoryModel[]> {
    return new Observable<CategoryModel[]>((subscriber) => {
      const q = query(this.col, orderBy('sortOrder'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as CategoryModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async create(form: CategoryFormModel): Promise<void> {
    const ref = doc(this.col, form.code);
    await setDoc(ref, {
      ...form,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
      deletedAt: null,
      deletedByUid: null,
    });
  }

  async update(code: string, form: Partial<CategoryFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/categories/${code}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  async softDelete(code: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/categories/${code}`);
    await updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
      deletedByUid: this.auth.user()?.uid ?? null,
    });
  }
}
