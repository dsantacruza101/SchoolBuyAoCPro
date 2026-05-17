import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

/**
 * Application shell component.
 *
 * Composes the fixed sidebar, sticky topbar, and a `<router-outlet>` into the
 * persistent layout that wraps every authenticated page. This component itself
 * holds no business logic; its sole responsibility is layout composition.
 *
 * Route structure:
 * ```
 * { path: '', component: ShellComponent, canActivate: [authGuard], children: [...] }
 * ```
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {}
