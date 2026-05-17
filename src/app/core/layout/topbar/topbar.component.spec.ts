import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';

import { TopbarComponent } from './topbar.component';
import { AuthService } from '../../../features/auth/services';
import { AuthUserModel } from '../../../features/auth/models';

const MOCK_PROFILE: AuthUserModel = {
  uid: 'uid-001',
  email: 'admin@academyofthecity.org',
  displayName: 'Daniel Santa Cruz',
  photoURL: null,
  caps: ['budgets.view'],
};

function makeAuthStub(profile: AuthUserModel | null = MOCK_PROFILE): Partial<AuthService> {
  return {
    profile: signal(profile),
    caps: signal(profile?.caps ?? []),
    signOut: jasmine.createSpy('signOut').and.resolveTo(),
  };
}

describe('TopbarComponent', () => {
  let fixture: ComponentFixture<TopbarComponent>;
  let component: TopbarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopbarComponent, RouterTestingModule, AvatarModule, MenuModule, ButtonModule],
      providers: [{ provide: AuthService, useValue: makeAuthStub() }],
    }).compileComponents();

    fixture = TestBed.createComponent(TopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the user display name', () => {
    const nameEl = fixture.debugElement.query(By.css('.topbar__display-name'));
    expect(nameEl.nativeElement.textContent.trim()).toBe('Daniel Santa Cruz');
  });

  it('should compute avatarLabel as first character of displayName', () => {
    expect(component.avatarLabel).toBe('D');
  });

  it('should return "?" for avatarLabel when profile is null', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TopbarComponent, RouterTestingModule, AvatarModule, MenuModule, ButtonModule],
      providers: [{ provide: AuthService, useValue: makeAuthStub(null) }],
    }).compileComponents();

    const f = TestBed.createComponent(TopbarComponent);
    expect(f.componentInstance.avatarLabel).toBe('?');
  });

  it('should include a Sign out menu item', () => {
    const signOutItem = component.userMenu.find((m) => m.label === 'Sign out');
    expect(signOutItem).toBeTruthy();
  });
});
