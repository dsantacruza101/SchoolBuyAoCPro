import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { BadgeModule } from 'primeng/badge';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../features/auth/services';
import { NAV_ITEMS } from '../nav-items';

/** Minimal AuthService stub — controls which caps are visible. */
function makeAuthStub(caps: string[]): Partial<AuthService> {
  return {
    hasCap: (cap: string) => caps.includes(cap),
    caps: signal(caps),
    profile: signal(null),
  };
}

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  /**
   * Helper that re-creates the fixture with a specific capability set.
   *
   * @param caps - Capability strings the stub user holds.
   */
  async function setup(caps: string[]): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule, BadgeModule],
      providers: [{ provide: AuthService, useValue: makeAuthStub(caps) }],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup([]);
    expect(component).toBeTruthy();
  });

  it('should render only nav items the user has caps for', async () => {
    await setup(['budgets.view', 'requests.view']);
    const links = fixture.debugElement.queryAll(By.css('.sidebar__item'));
    // user holds budgets.view → Dashboard, Budgets visible (2)
    // user holds requests.view → Requests visible (1)  → total 3
    expect(links.length).toBe(3);
  });

  it('should render ALL nav items for admin with all caps', async () => {
    const allCaps = NAV_ITEMS.filter((i) => i.cap).map((i) => i.cap as string);
    await setup(allCaps);
    const links = fixture.debugElement.queryAll(By.css('.sidebar__item'));
    expect(links.length).toBe(NAV_ITEMS.length);
  });

  it('should render zero nav items when user has no caps', async () => {
    await setup([]);
    const links = fixture.debugElement.queryAll(By.css('.sidebar__item'));
    expect(links.length).toBe(0);
  });

  it('should display the school name in the brand area', async () => {
    await setup([]);
    const school = fixture.debugElement.query(By.css('.sidebar__brand-school'));
    expect(school.nativeElement.textContent.trim()).toBe('Academy of the City');
  });
});
