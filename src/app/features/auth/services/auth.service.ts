import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from '@angular/fire/auth';
import { doc, Firestore, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../environments/environment';
import { AUTH_ERROR_MAP, SCHOOL_DOMAIN } from '../constants';
import { AuthUserModel } from '../models';

/**
 * Central authentication service for SchoolBuy AoC Pro.
 *
 * Wraps Firebase Auth and exposes reactive Angular signals so the rest of
 * the app can consume auth state without subscribing to observables.
 * Also writes/updates the `/users/{uid}` Firestore document on every sign-in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);

  /** The raw Firebase `User` object, or `null` when signed out. */
  readonly user = signal<User | null>(null);

  /** Lightweight profile snapshot built from the Firebase user + JWT claims. */
  readonly profile = signal<AuthUserModel | null>(null);

  /**
   * `true` while the initial Firebase auth check is in flight.
   * Guards and components wait on this before reading `user()` to avoid
   * a flash-redirect on hard refresh.
   */
  readonly loading = signal<boolean>(true);

  /** Capability strings from the JWT custom claims for the current school. */
  readonly caps = signal<string[]>([]);

  /**
   * Subscribes to Firebase Auth state changes on construction.
   * Populates `user`, `profile`, `caps`, and `loading` signals reactively.
   * Also upserts the `/users/{uid}` Firestore document and reads JWT claims.
   */
  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      this.user.set(firebaseUser);

      if (firebaseUser) {
        await this.upsertUserDoc(firebaseUser);
        const token = await firebaseUser.getIdTokenResult();
        const schoolCaps = (token.claims['schools'] as Record<string, { caps: string[] }>)?.['aoc'];
        this.caps.set(schoolCaps?.caps ?? []);
        this.profile.set({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          caps: schoolCaps?.caps ?? [],
        });
      } else {
        this.profile.set(null);
        this.caps.set([]);
      }

      this.loading.set(false);
    });
  }

  /**
   * Signs the user in via Google OAuth popup.
   *
   * Sets the `hd` (hosted domain) hint so Google pre-filters to school accounts.
   * After the popup resolves, enforces that the authenticated email belongs to
   * `@academyofthecity.org` — signs out and throws if it does not.
   *
   * @throws {Error} With message `'DOMAIN_RESTRICTED'` when the authenticated
   *                 email is not from the school domain.
   */
  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    if (environment.restrictDomain) {
      provider.setCustomParameters({ hd: SCHOOL_DOMAIN });
    }

    const result = await signInWithPopup(this.auth, provider);

    if (environment.restrictDomain && !result.user.email?.endsWith(`@${SCHOOL_DOMAIN}`)) {
      await signOut(this.auth);
      throw new Error('DOMAIN_RESTRICTED');
    }
  }

  /**
   * Signs the user in with email and password credentials.
   *
   * @param email - The user's registered email address.
   * @param password - The user's password (minimum 6 characters).
   * @throws Firebase Auth errors — map them with `mapError()` before displaying.
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Sends a password-reset email to the specified address.
   *
   * @param email - The email address associated with the account.
   */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Signs the current user out and navigates to `/login`.
   * Clears all auth signals via the `onAuthStateChanged` listener automatically.
   */
  async signOut(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }

  /**
   * Returns `true` when the current user's JWT includes the given capability string.
   * Capability strings are defined in the capability catalog (`/settings/config`).
   *
   * @param cap - A capability string (e.g. `'budgets.view'`, `'requests.approve'`).
   */
  hasCap(cap: string): boolean {
    return this.caps().includes(cap);
  }

  /**
   * Maps a Firebase Auth error code to a user-facing message string.
   * Returns a generic fallback when the code is not in `AUTH_ERROR_MAP`.
   * Returns an empty string for errors that should be silently swallowed
   * (e.g. `auth/popup-closed-by-user`).
   *
   * @param error - The thrown value (expected to carry a `.code` property from Firebase).
   */
  mapError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';
    return AUTH_ERROR_MAP[code] ?? 'An unexpected error occurred. Please try again.';
  }

  /**
   * Creates or merges the `/users/{uid}` Firestore document on every sign-in.
   * Uses `merge: true` so fields written by Cloud Functions (e.g. `defaultSchoolId`)
   * are never overwritten by this client-side upsert.
   *
   * @param firebaseUser - The Firebase `User` object from the auth state change.
   */
  private async upsertUserDoc(firebaseUser: User): Promise<void> {
    const ref = doc(this.firestore, `users/${firebaseUser.uid}`);
    await setDoc(
      ref,
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}
