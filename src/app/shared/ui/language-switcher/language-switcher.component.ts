import { Component, inject, LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/** Describes a supported locale with its router base href. */
interface LocaleOption {
  code: string;
  label: string;
  baseHref: string;
}

/** All locales the app is built for. Must match `angular.json` i18n configuration. */
const LOCALES: LocaleOption[] = [
  { code: 'en-US', label: 'EN', baseHref: '/' },
  { code: 'es',    label: 'ES', baseHref: '/es/' },
];

/**
 * Minimal locale switcher for build-time i18n (`@angular/localize`).
 *
 * Because Angular build-time i18n produces separate bundles per locale,
 * switching languages requires a full page navigation to the other bundle's
 * base href. This component handles that navigation while preserving the
 * current path and query string.
 *
 * Only functional in production builds (or `ng serve --configuration=es`).
 * In the default dev server all text renders in the source locale regardless.
 */
@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css',
})
export class LanguageSwitcherComponent {
  private readonly document = inject(DOCUMENT);

  /** The locale code of the current bundle, injected by Angular's i18n runtime. */
  readonly currentLocale = inject(LOCALE_ID);

  /** Available locales rendered as toggle buttons. */
  readonly locales = LOCALES;

  /**
   * Navigates the browser to the equivalent page in the target locale.
   *
   * Strips the active locale's base href from the current path, then
   * prepends the target base href before assigning to `location.href`.
   *
   * @param baseHref - The base href of the target locale (e.g. `'/'` for
   *                   English, `'/es/'` for Spanish).
   */
  switchTo(baseHref: string): void {
    const current = this.document.location;
    const path = current.pathname + current.search + current.hash;

    const activeBase = LOCALES.find((l) => l.code === this.currentLocale)?.baseHref ?? '/';
    const relative = path.startsWith(activeBase) ? path.slice(activeBase.length) : path;

    this.document.location.href = baseHref + relative;
  }
}
