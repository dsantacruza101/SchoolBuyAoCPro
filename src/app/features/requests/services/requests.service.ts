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
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { RequestFormModel, RequestModel } from '../models';
import { CURRENT_FISCAL_YEAR } from '../../events/models';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/requests`);
  }

  /** Returns all active requests ordered by creation date descending. */
  getAll(): Observable<RequestModel[]> {
    return new Observable<RequestModel[]>((subscriber) => {
      const q = query(
        this.col,
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as RequestModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async create(form: RequestFormModel): Promise<string> {
    const ref = await addDoc(this.col, {
      ...form,
      poNumber: null,
      requestDate: serverTimestamp(),
      statusCode: 'pending',
      approvedByUid: null,
      approvedByLabel: null,
      approvedAt: null,
      dateOrdered: null,
      dateReceived: null,
      attachmentCount: 0,
      active: true,
      deletedAt: null,
      deletedByUid: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
    return ref.id;
  }

  async softDelete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/requests/${id}`);
    await updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp(),
      deletedByUid: this.auth.user()?.uid ?? null,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }
}
