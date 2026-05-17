import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';

import { RolesListComponent } from './roles-list.component';
import { RolesService } from '../../services';
import { RoleModel } from '../../models';

const MOCK_ADMIN_ROLE: RoleModel = {
  id: 'admin',
  code: 'admin',
  name: 'Administrator',
  description: 'Full access.',
  isSystem: true,
  sortOrder: 10,
  memberCount: 1,
  capabilities: ['roles.manage', 'budgets.view'],
  createdAt: null,
  updatedAt: null,
  updatedByUid: null,
};

const MOCK_CUSTOM_ROLE: RoleModel = {
  id: 'custom_id',
  code: 'tech_lead',
  name: 'Tech Lead',
  description: '',
  isSystem: false,
  sortOrder: 100,
  memberCount: 0,
  capabilities: ['requests.view'],
  createdAt: null,
  updatedAt: null,
  updatedByUid: null,
};

function makeRolesServiceStub(): Partial<RolesService> {
  return {
    getAll: () => of([MOCK_ADMIN_ROLE, MOCK_CUSTOM_ROLE]),
    create: jasmine.createSpy('create').and.resolveTo(),
    update: jasmine.createSpy('update').and.resolveTo(),
    delete: jasmine.createSpy('delete').and.resolveTo(),
  };
}

describe('RolesListComponent', () => {
  let fixture: ComponentFixture<RolesListComponent>;
  let component: RolesListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesListComponent, ReactiveFormsModule],
      providers: [
        { provide: RolesService, useValue: makeRolesServiceStub() },
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('cannotDelete()', () => {
    it('should return true for system roles', () => {
      expect(component.cannotDelete(MOCK_ADMIN_ROLE)).toBeTrue();
    });

    it('should return true when memberCount > 0', () => {
      const role = { ...MOCK_CUSTOM_ROLE, memberCount: 3 };
      expect(component.cannotDelete(role)).toBeTrue();
    });

    it('should return false for custom roles with no members', () => {
      expect(component.cannotDelete(MOCK_CUSTOM_ROLE)).toBeFalse();
    });
  });

  describe('toggleCap()', () => {
    it('should add a cap when not already present', () => {
      component.openCreate();
      component.toggleCap('budgets.view');
      expect(component.hasCap('budgets.view')).toBeTrue();
    });

    it('should remove a cap when already present', () => {
      component.openEdit({ ...MOCK_CUSTOM_ROLE, capabilities: ['requests.view'] });
      component.toggleCap('requests.view');
      expect(component.hasCap('requests.view')).toBeFalse();
    });

    it('should NOT remove roles.manage from the admin role', () => {
      component.openEdit(MOCK_ADMIN_ROLE);
      component.toggleCap('roles.manage');
      expect(component.hasCap('roles.manage')).toBeTrue();
    });
  });

  describe('deleteTooltip()', () => {
    it('should return system message for system roles', () => {
      expect(component.deleteTooltip(MOCK_ADMIN_ROLE)).toContain('System roles');
    });

    it('should mention member count when role has members', () => {
      const role = { ...MOCK_CUSTOM_ROLE, memberCount: 2 };
      expect(component.deleteTooltip(role)).toContain('2');
    });
  });
});
