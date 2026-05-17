import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authState } from '@angular/fire/auth';
import { map, switchMap, take } from 'rxjs';
import { from } from 'rxjs';

import { AuthService } from '../../features/auth/services';

/**
 * Capability-based route guard.
 *
 * Reads the required capability from `route.data['cap']`. If the currently
 * signed-in user does not hold that capability in their JWT custom claims, they
 * are redirected to `/no-access` with the missing capability name attached as
 * a query parameter so the NoAccess page can surface a helpful message.
 *
 * Routes that omit `data.cap` pass through unconditionally (being authenticated
 * via `authGuard` is sufficient).
 *
 * This guard waits for Firebase Auth to resolve its initial persistence check
 * (via `authState`) before evaluating capabilities, which prevents a flash
 * redirect on hard refresh.
 *
 * Usage:
 * ```ts
 * {
 *   path: 'roles',
 *   canActivate: [roleGuard],
 *   data: { cap: 'roles.manage', title: 'Roles & Permissions' }
 * }
 * ```
 */
export const roleGuard: CanActivateFn = (route) => {
  const authSvc = inject(AuthService);
  const firebaseAuth = inject(Auth);
  const router = inject(Router);

  const required = route.data['cap'] as string | undefined;

  if (!required) return true;

  return authState(firebaseAuth).pipe(
    take(1),
    switchMap((user) =>
      user
        ? from(user.getIdTokenResult(false)).pipe(
            map(() =>
              authSvc.hasCap(required)
                ? true
                : router.createUrlTree(['/no-access'], { queryParams: { cap: required } }),
            ),
          )
        : [router.createUrlTree(['/login'])],
    ),
  );
};
