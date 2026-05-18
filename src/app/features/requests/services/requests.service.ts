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
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { AuthService } from '../../auth/services';
import { AuditEntryModel, RequestFormModel, RequestModel } from '../models';
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
      const q = query(this.col, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }) as RequestModel)
            .filter((r) => r.active);
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

  getById(requestId: string): Observable<RequestModel | null> {
    return new Observable<RequestModel | null>((subscriber) => {
      const ref = doc(this.firestore, `schools/${SCHOOL_ID}/requests/${requestId}`);
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          subscriber.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as RequestModel) : null);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  getAudit(requestId: string): Observable<AuditEntryModel[]> {
    return new Observable<AuditEntryModel[]>((subscriber) => {
      const auditCol = collection(
        this.firestore,
        `schools/${SCHOOL_ID}/requests/${requestId}/audit`,
      );
      const q = query(auditCol, orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snap) => {
          subscriber.next(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditEntryModel),
          );
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async updateStatus(
    requestId: string,
    fromStatus: string,
    toStatus: string,
    note: string | null = null,
  ): Promise<void> {
    const uid   = this.auth.user()?.uid ?? '';
    const label = this.auth.user()?.displayName ?? this.auth.user()?.email ?? uid;
    const now   = serverTimestamp();

    const requestRef = doc(this.firestore, `schools/${SCHOOL_ID}/requests/${requestId}`);
    const auditRef   = doc(collection(this.firestore, `schools/${SCHOOL_ID}/requests/${requestId}/audit`));

    const extra: Record<string, unknown> = {};
    if (toStatus === 'approved') {
      extra['approvedByUid']   = uid;
      extra['approvedByLabel'] = label;
      extra['approvedAt']      = now;
    } else if (toStatus === 'ordered') {
      extra['dateOrdered'] = now;
    } else if (toStatus === 'received') {
      extra['dateReceived'] = now;
    }

    const batch = writeBatch(this.firestore);
    batch.update(requestRef, { statusCode: toStatus, ...extra, updatedAt: now, updatedByUid: uid });
    batch.set(auditRef, { action: toStatus, fromStatus, toStatus, byUid: uid, byLabel: label, note, timestamp: now });
    await batch.commit();
  }
}
