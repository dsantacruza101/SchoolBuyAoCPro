/**
 * Lightweight profile snapshot stored in `AuthService` after sign-in.
 * Mirrors the Firebase Auth user fields needed by the UI and capability checks.
 * Populated from the Firebase `User` object plus JWT custom claims.
 */
export interface AuthUserModel {
  /** Firebase Authentication UID — stable identifier for the user. */
  uid: string;
  /** Primary email address from Firebase Auth. `null` if the provider did not supply one. */
  email: string | null;
  /** Display name from Firebase Auth or the Google profile. */
  displayName: string | null;
  /** Avatar URL from the Google profile or Firebase Storage. */
  photoURL: string | null;
  /** Capability strings extracted from the JWT custom claims for this school. */
  caps: string[];
  /** Timestamp of the most recent successful sign-in (optional; written by Firestore). */
  lastLoginAt?: Date;
}
