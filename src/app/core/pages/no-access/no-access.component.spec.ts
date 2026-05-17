import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

import { NoAccessComponent } from './no-access.component';

/**
 * Builds a minimal `ActivatedRoute` stub with the given query params.
 *
 * @param params - Key-value map of query parameters.
 */
function makeRoute(params: Record<string, string>): Partial<ActivatedRoute> {
  return {
    queryParamMap: of(convertToParamMap(params)),
  };
}

describe('NoAccessComponent', () => {
  let fixture: ComponentFixture<NoAccessComponent>;

  /**
   * Configures the TestBed with a stubbed `ActivatedRoute`.
   *
   * @param params - Query parameters to inject.
   */
  async function setup(params: Record<string, string> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [NoAccessComponent, RouterTestingModule, CardModule, ButtonModule],
      providers: [{ provide: ActivatedRoute, useValue: makeRoute(params) }],
    }).compileComponents();

    fixture = TestBed.createComponent(NoAccessComponent);
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the required capability when cap query param is present', async () => {
    await setup({ cap: 'roles.manage' });
    const cap = fixture.debugElement.query(By.css('.no-access__cap'));
    expect(cap.nativeElement.textContent.trim()).toBe('roles.manage');
  });

  it('should not render the capability element when cap param is absent', async () => {
    await setup({});
    const cap = fixture.debugElement.query(By.css('.no-access__cap'));
    expect(cap).toBeNull();
  });
});
