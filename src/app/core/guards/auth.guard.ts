import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs';

/**
 * Functional route guard that allows access only to authenticated users.
 *
 * Uses `authState` from AngularFire instead of `toObservable(loading)` so
 * the guard waits for Firebase to finish its initial persistence check before
 * making a decision — preventing a flash redirect to `/login` on hard refresh.
 *
 * @returns `true` when a Firebase user is present, or a `UrlTree`
 *          redirecting to `/login` when the session is unauthenticated.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};
