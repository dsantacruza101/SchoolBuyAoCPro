import { inject, Injectable } from '@angular/core';
import {
  collection,
  Firestore,
  onSnapshot,
  query,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { SCHOOL_ID } from '../../../core/constants';
import { RollupModel } from '../models';

/**
 * Reads pre-aggregated rollup docs written by Cloud Functions.
 * Rollup IDs follow the pattern `dept_{deptId}`.
 * All writes to this collection are server-only — this service is read-only.
 */
@Injectable({ providedIn: 'root' })
export class BudgetsService {
  private readonly firestore = inject(Firestore);

  private get col() {
    return collection(this.firestore, `schools/${SCHOOL_ID}/rollups`);
  }

  /** Returns a Map keyed by departmentId for O(1) lookup in computed signals. */
  getRollupMap(): Observable<Map<string, RollupModel>> {
    return new Observable<Map<string, RollupModel>>((subscriber) => {
      const q = query(this.col);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const map = new Map<string, RollupModel>();
          for (const d of snapshot.docs) {
            const rollup = { id: d.id, ...d.data() } as RollupModel;
            if (rollup.departmentId) {
              map.set(rollup.departmentId, rollup);
            }
          }
          subscriber.next(map);
        },
        (err) => {
          // Rollups are Cloud-Function-written and may not exist yet.
          // Emit an empty map so the Budgets page still renders without rollup data.
          console.warn('BudgetsService: rollups unavailable —', err.message);
          subscriber.next(new Map());
        },
      );
      return unsubscribe;
    });
  }
}
