import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../../features/auth/services';
import { AuthUserModel } from '../../../../features/auth/models';

const MOCK_PROFILE: AuthUserModel = {
  uid: 'uid-001',
  email: 'admin@academyofthecity.org',
  displayName: 'Daniel Santa Cruz',
  photoURL: null,
  caps: ['budgets.view', 'requests.view'],
};

function makeAuthStub(
  profile: AuthUserModel | null,
  caps: string[],
): Partial<AuthService> {
  return {
    profile: signal(profile),
    caps: signal(caps),
  };
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  /**
   * Configures the testing module and creates the fixture.
   *
   * @param profile - Auth profile to stub (or null for signed-out state).
   * @param caps - Capabilities to inject.
   */
  async function setup(
    profile: AuthUserModel | null = MOCK_PROFILE,
    caps: string[] = MOCK_PROFILE.caps,
  ): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, CardModule, TagModule, DividerModule],
      providers: [{ provide: AuthService, useValue: makeAuthStub(profile, caps) }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should display the user display name in the heading', async () => {
    await setup();
    const heading = fixture.debugElement.query(By.css('.dashboard__heading'));
    expect(heading.nativeElement.textContent).toContain('Daniel Santa Cruz');
  });

  it('should render a tag for each capability', async () => {
    await setup(MOCK_PROFILE, ['budgets.view', 'requests.view', 'audit.view']);
    // allow async rendering
    fixture.detectChanges();
    const tags = fixture.debugElement.queryAll(By.css('p-tag'));
    expect(tags.length).toBe(3);
  });

  it('should show a warning tag when user has no capabilities', async () => {
    await setup(MOCK_PROFILE, []);
    fixture.detectChanges();
    const tags = fixture.debugElement.queryAll(By.css('p-tag'));
    expect(tags.length).toBe(1);
  });

  it('should fall back to "there" when profile is null', async () => {
    await setup(null, []);
    const heading = fixture.debugElement.query(By.css('.dashboard__heading'));
    expect(heading.nativeElement.textContent).toContain('there');
  });
});
