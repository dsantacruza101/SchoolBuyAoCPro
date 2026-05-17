import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';

import { GradeLevelsListComponent } from './grade-levels-list.component';
import { GradeLevelsService } from '../../services';
import { GradeLevelModel } from '../../models';

const MOCK_ITEM: GradeLevelModel = {
  id: 'gl1',
  name: 'Kindergarten',
  sortOrder: 10,
  createdAt: null,
  updatedAt: null,
  updatedByUid: null,
};

function makeServiceStub(): Partial<GradeLevelsService> {
  return {
    getAll: () => of([MOCK_ITEM]),
    create: jasmine.createSpy('create').and.resolveTo(),
    update: jasmine.createSpy('update').and.resolveTo(),
    delete: jasmine.createSpy('delete').and.resolveTo(),
  };
}

describe('GradeLevelsListComponent', () => {
  let fixture: ComponentFixture<GradeLevelsListComponent>;
  let component: GradeLevelsListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeLevelsListComponent, ReactiveFormsModule],
      providers: [
        { provide: GradeLevelsService, useValue: makeServiceStub() },
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GradeLevelsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('openEdit()', () => {
    it('should populate the form with the selected grade level', () => {
      component.openEdit(MOCK_ITEM);
      expect(component.form.get('name')?.value).toBe('Kindergarten');
      expect(component.form.get('sortOrder')?.value).toBe(10);
      expect(component.editing()).toEqual(MOCK_ITEM);
      expect(component.dialogVisible()).toBeTrue();
    });
  });

  describe('openCreate()', () => {
    it('should reset the form and clear editing state', () => {
      component.openEdit(MOCK_ITEM);
      component.openCreate();
      expect(component.editing()).toBeNull();
      expect(component.form.get('name')?.value).toBeFalsy();
    });
  });

  describe('save()', () => {
    it('should not save when form is invalid', async () => {
      component.openCreate();
      component.form.get('name')?.setValue('');
      await component.save();
      expect(component.form.touched).toBeTrue();
    });
  });
});
