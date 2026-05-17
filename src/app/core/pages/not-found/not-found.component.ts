import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

/**
 * 404 Not Found page.
 *
 * Rendered by the wildcard `'**'` route.  Displays a friendly message and a
 * link back to the dashboard.  Intentionally has no business logic — it is a
 * pure display component.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, CardModule, ButtonModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css',
})
export class NotFoundComponent {}
