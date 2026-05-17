import { Component, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

import { AuthService } from '../../../../features/auth/services';

/**
 * Dashboard skeleton component (US-002 verification page).
 *
 * Renders the signed-in user's display name and their full capability list
 * as PrimeNG tags. Seeing this page with a non-empty capability list confirms
 * that the Firebase Auth → JWT custom claims → AuthService → roleGuard →
 * ShellComponent pipeline is working end-to-end.
 *
 * The real KPI tiles, charts, and Firestore data will replace this skeleton
 * in a later ticket (US-015).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, TagModule, DividerModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);

  /** The current user's profile (display name, email). */
  readonly profile = this.auth.profile;

  /** Capability strings the current user holds. */
  readonly caps = this.auth.caps;
}
