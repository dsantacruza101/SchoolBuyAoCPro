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
import { EventFormModel, EventModel } from '../models';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/events`);
  }

  getAll(): Observable<EventModel[]> {
    return new Observable<EventModel[]>((subscriber) => {
      const q = query(this.col, orderBy('name'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as EventModel,
          );
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return unsubscribe;
    });
  }

  async create(form: EventFormModel): Promise<void> {
    await addDoc(this.col, {
      ...form,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
      deletedAt: null,
      deletedByUid: null,
    });
  }

  async update(id: string, form: Partial<EventFormModel>): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/events/${id}`);
    await updateDoc(ref, {
      ...form,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }

  async softDelete(id: string): Promise<void> {
    const ref = doc(this.firestore, `schools/${SCHOOL_ID}/events/${id}`);
    await updateDoc(ref, {
      active: false,
      deletedAt: serverTimestamp(),
      deletedByUid: this.auth.user()?.uid ?? null,
      updatedAt: serverTimestamp(),
      updatedByUid: this.auth.user()?.uid ?? null,
    });
  }
}
