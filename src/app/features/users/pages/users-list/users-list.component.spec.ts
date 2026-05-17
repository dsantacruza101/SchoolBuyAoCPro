import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';

import { UsersListComponent } from './users-list.component';
import { UsersService } from '../../services';
import { RolesService } from '../../../roles/services';
import { UserMembershipModel } from '../../models';

const MOCK_ADMIN: UserMembershipModel = {
  id: 'uid1_aoc',
  uid: 'uid1',
  schoolId: 'aoc',
  roleId: 'admin',
  roleCode: 'admin',
  email: 'admin@aoc.org',
  displayName: 'Alice Admin',
  active: true,
  photoURL: null,
};

const MOCK_STAFF: UserMembershipModel = {
  id: 'uid2_aoc',
  uid: 'uid2',
  schoolId: 'aoc',
  roleId: 'staff',
  roleCode: 'staff',
  email: 'staff@aoc.org',
  displayName: 'Bob Staff',
  active: true,
  photoURL: null,
};

function makeUsersServiceStub(): Partial<UsersService> {
  return {
    getMembers: () => of([MOCK_ADMIN, MOCK_STAFF]),
    getPendingInvites: () => of([]),
    invite: jasmine.createSpy('invite').and.resolveTo(),
    updateRole: jasmine.createSpy('updateRole').and.resolveTo(),
    setActive: jasmine.createSpy('setActive').and.resolveTo(),
    revokeInvite: jasmine.createSpy('revokeInvite').and.resolveTo(),
  };
}

function makeRolesServiceStub(): Partial<RolesService> {
  return {
    getAll: () => of([]),
  };
}

describe('UsersListComponent', () => {
  let fixture: ComponentFixture<UsersListComponent>;
  let component: UsersListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersListComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: UsersService, useValue: makeUsersServiceStub() },
        { provide: RolesService, useValue: makeRolesServiceStub() },
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return two uppercase initials for a two-word name', () => {
      expect(component.getInitials('Alice Admin')).toBe('AA');
    });

    it('should return one initial for a single-word name', () => {
      expect(component.getInitials('Alice')).toBe('A');
    });
  });

  describe('isLastActiveAdmin()', () => {
    it('should return true when the member is the sole active admin', () => {
      expect(component.isLastActiveAdmin(MOCK_ADMIN)).toBeTrue();
    });

    it('should return false for non-admin members', () => {
      expect(component.isLastActiveAdmin(MOCK_STAFF)).toBeFalse();
    });

    it('should return false when there are multiple active admins', () => {
      const secondAdmin: UserMembershipModel = {
        ...MOCK_ADMIN,
        id: 'uid3_aoc',
        uid: 'uid3',
        displayName: 'Second Admin',
      };
      // Fake a second admin being present
      spyOn(component, 'members' as never).and.returnValue([MOCK_ADMIN, secondAdmin, MOCK_STAFF] as never);
      expect(component.isLastActiveAdmin(MOCK_ADMIN)).toBeFalse();
    });
  });
});
