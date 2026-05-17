import { Timestamp } from '@angular/fire/firestore';

/**
 * Mirrors `/schools/{schoolId}/gradeLevels/{gradeLevelId}`.
 * Used to classify staff, events, and purchase requests by academic level.
 */
export interface GradeLevelModel {
  /** Firestore document ID. */
  id: string;
  /** Display name shown across the app (e.g. "PreK", "Kindergarten", "3rd Grade"). */
  name: string;
  /** Controls display order in lists and dropdowns. Lower = first. */
  sortOrder: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
}

/** Payload for create and update operations. */
export interface GradeLevelFormModel {
  name: string;
  sortOrder: number;
}
