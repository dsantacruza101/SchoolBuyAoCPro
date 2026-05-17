import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Auth } from '@angular/fire/auth';

import { roleGuard } from './role.guard';
import { AuthService } from '../../features/auth/services';

/** Minimal Firebase Auth stub that returns a resolved user immediately. */
function makeFirebaseAuthStub(user: unknown): Partial<Auth> {
  return {} as Partial<Auth>;
}

/** Builds an ActivatedRouteSnapshot with the given `data` map. */
function makeRoute(data: Record<string, unknown>): ActivatedRouteSnapshot {
  return { data } as unknown as ActivatedRouteSnapshot;
}

describe('roleGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;

  /**
   * Creates the TestBed environment with a stubbed AuthService and Auth.
   *
   * @param caps - Capabilities the stub user holds.
   * @param firebaseUser - The value that `authState` will emit.
   */
  function setup(caps: string[], firebaseUser: unknown = { getIdTokenResult: () => Promise.resolve({}) }): void {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'navigate']);
    routerSpy.createUrlTree.and.returnValue([] as unknown as ReturnType<Router['createUrlTree']>);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            hasCap: (cap: string) => caps.includes(cap),
            caps: signal(caps),
            profile: signal(null),
          },
        },
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: makeFirebaseAuthStub(firebaseUser) },
      ],
    });
  }

  it('should allow access when no cap is required', (done) => {
    setup([]);
    const route = makeRoute({});

    TestBed.runInInjectionContext(() => {
      const result$ = roleGuard(route, {} as never);
      if (typeof result$ === 'boolean') {
        expect(result$).toBeTrue();
        done();
      }
    });
  });
});
