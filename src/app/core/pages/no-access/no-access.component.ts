import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

/**
 * No-access page displayed when `roleGuard` blocks navigation.
 *
 * Reads the `cap` query parameter injected by `roleGuard` and surfaces it in
 * a human-readable message so the user knows exactly which capability they are
 * missing and can ask an administrator to grant it.
 *
 * Route: `/no-access?cap=<capability-string>`
 */
@Component({
  selector: 'app-no-access',
  standalone: true,
  imports: [RouterModule, CardModule, ButtonModule],
  templateUrl: './no-access.component.html',
  styleUrl: './no-access.component.css',
})
export class NoAccessComponent {
  private readonly route = inject(ActivatedRoute);

  /**
   * The capability string passed by `roleGuard` as `?cap=...`.
   * `null` when the page is navigated to directly without a query param.
   */
  readonly cap = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('cap'))),
    { initialValue: null },
  );
}
