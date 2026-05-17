import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Checkbox } from 'primeng/checkbox';
import { Divider } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Password } from 'primeng/password';

import { AuthService } from '../../services';
import { LanguageSwitcherComponent } from '../../../../shared/ui';

/** Login page — Google SSO + email/password sign-in for school staff. */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    Card,
    Checkbox,
    Divider,
    InputText,
    Message,
    Password,
    LanguageSwitcherComponent,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  readonly busyGoogle = signal(false);
  readonly busyEmail = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // Redirect authenticated users away from the login page immediately.
    effect(() => {
      if (!this.authService.loading() && this.authService.user()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  /**
   * Initiates Google OAuth sign-in via popup.
   * Shows a PrimeNG toast on failure; sets `busyGoogle` during the request.
   */
  async onGoogle(): Promise<void> {
    this.error.set(null);
    this.busyGoogle.set(true);
    try {
      await this.authService.signInWithGoogle();
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      const message =
        (err as Error)?.message === 'DOMAIN_RESTRICTED'
          ? `Use your @academyofthecity.org account to sign in.`
          : this.authService.mapError(err);

      if (message) {
        this.msg.add({ severity: 'error', summary: 'Sign-in failed', detail: message, life: 6000 });
      }
    } finally {
      this.busyGoogle.set(false);
    }
  }

  /**
   * Submits the email/password form.
   * Sets the `error` signal on failure. No-ops when the form is invalid.
   */
  async onEmail(): Promise<void> {
    if (this.form.invalid) return;
    this.error.set(null);
    this.busyEmail.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.authService.signInWithEmail(email, password);
      await this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.error.set(this.authService.mapError(err));
    } finally {
      this.busyEmail.set(false);
    }
  }

  /** Accessor for the email form control (used in the template for validation display). */
  get emailCtrl() { return this.form.controls.email; }

  /** Accessor for the password form control (used in the template for validation display). */
  get passwordCtrl() { return this.form.controls.password; }
}
