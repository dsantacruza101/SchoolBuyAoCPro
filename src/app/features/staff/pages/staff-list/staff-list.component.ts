import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { DepartmentsService } from '../../../departments/services';
import { GradeLevelsService } from '../../../grade-levels/services';
import { StaffService } from '../../services';
import { StaffFormModel, StaffModel } from '../../models';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.css',
})
export class StaffListComponent implements OnInit {
  private readonly service = inject(StaffService);
  private readonly deptService = inject(DepartmentsService);
  private readonly gradeService = inject(GradeLevelsService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  private readonly firestoreData = toSignal(this.service.getAll(), { initialValue: [] });
  private readonly allDepts = toSignal(this.deptService.getAll(), { initialValue: [] });
  private readonly allGrades = toSignal(this.gradeService.getAll(), { initialValue: [] });

  /** Active staff ordered by name. */
  readonly displayItems = computed(() => this.firestoreData().filter((s) => s.active));

  /** Active departments for the department picker. */
  readonly deptOptions = computed(() =>
    this.allDepts().filter((d) => d.active),
  );

  /** Grade levels for the gradeAssignments multi-select. */
  readonly gradeOptions = computed(() => this.allGrades());

  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<StaffModel | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      email: ['', [Validators.required, Validators.email]],
      departmentId: [null],
      grade: [''],
      gradeAssignments: [[]],
      personalBudget: [null],
      phone: [''],
    });
  }

  /** Resolves the department name for a given ID from the loaded snapshot. */
  deptName(id: string | null): string {
    if (!id) return '—';
    return this.allDepts().find((d) => d.id === id)?.name ?? '—';
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '', email: '', departmentId: null,
      grade: '', gradeAssignments: [], personalBudget: null, phone: '',
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: StaffModel): void {
    this.editing.set(item);
    this.form.patchValue({
      name: item.name,
      email: item.email,
      departmentId: item.departmentId,
      grade: item.grade ?? '',
      gradeAssignments: item.gradeAssignments ?? [],
      personalBudget: item.personalBudget,
      phone: item.phone ?? '',
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editing.set(null);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const selectedDept = this.allDepts().find((d) => d.id === raw.departmentId);

    const payload: StaffFormModel = {
      name: raw.name,
      email: raw.email.toLowerCase().trim(),
      departmentId: raw.departmentId ?? null,
      departmentName: selectedDept?.name ?? null,
      grade: raw.grade || null,
      gradeAssignments: raw.gradeAssignments ?? [],
      personalBudget: raw.personalBudget ?? null,
      phone: raw.phone || null,
    };

    const item = this.editing();

    try {
      if (item) {
        await this.service.update(item.id, payload);
        this.msg.add({ severity: 'success', summary: 'Updated', detail: raw.name });
      } else {
        await this.service.create(payload);
        this.msg.add({ severity: 'success', summary: 'Created', detail: raw.name });
      }
      this.closeDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(item: StaffModel): void {
    this.confirm.confirm({
      header: 'Delete staff member',
      message: `Delete "${item.name}"? This cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.service.softDelete(item.id);
          this.msg.add({ severity: 'success', summary: 'Deleted', detail: item.name });
        } catch {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not delete.' });
        }
      },
    });
  }
}
