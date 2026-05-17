import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from 'primeng/api';

import { AuthService } from '../../../features/auth/services';

/**
 * Walks to the deepest activated route and returns the merged `data` object
 * so that nested child routes can contribute their own `title` / `subtitle`.
 *
 * @param route - The root `ActivatedRoute` to start from.
 * @returns The `data` record from the leaf route.
 */
function getLeafData(route: ActivatedRoute): Record<string, string> {
  let current = route;
  while (current.firstChild) {
    current = current.firstChild;
  }
  return (current.snapshot?.data ?? {}) as Record<string, string>;
}

/**
 * Topbar component for the authenticated shell.
 *
 * Shows the current page title (sourced from the active route's `data.title`
 * and `data.subtitle` fields) on the left, and a user avatar with a popup
 * sign-out menu on the right.
 *
 * Title signals update automatically on each navigation event so child routes
 * can declare their own `data: { title, subtitle }` without modifying this
 * component.
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule, AvatarModule, MenuModule, ButtonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** The current user's profile (display name, avatar, etc.). */
  readonly profile = this.auth.profile;

  /**
   * Stream of leaf-route data maps, emitted once per navigation end.
   * `startWith` ensures the signal has a value before the first navigation.
   */
  private readonly routeData$ = this.router.events.pipe(
    filter((e) => e instanceof NavigationEnd),
    startWith(null),
    map(() => getLeafData(this.route)),
  );

  /** Current page title, sourced from `route.data.title`. */
  readonly pageTitle = toSignal(this.routeData$.pipe(map((d) => d['title'] ?? '')), {
    initialValue: '',
  });

  /** Current page subtitle, sourced from `route.data.subtitle`. */
  readonly pageSubtitle = toSignal(this.routeData$.pipe(map((d) => d['subtitle'] ?? '')), {
    initialValue: '',
  });

  /** Avatar popup menu items. */
  readonly userMenu: MenuItem[] = [
    { label: 'My profile', icon: 'pi pi-user' },
    { separator: true },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.signOut() },
  ];

  /**
   * Returns the first character of the user's display name, used as an avatar
   * fallback label when no photo URL is available.
   */
  get avatarLabel(): string {
    return this.profile()?.displayName?.charAt(0).toUpperCase() ?? '?';
  }
}
