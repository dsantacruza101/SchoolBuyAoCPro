import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { DepartmentsService } from '../../services';
import {
  DEPARTMENT_KIND_OPTIONS,
  DepartmentFormModel,
  DepartmentKind,
  DepartmentModel,
} from '../../models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-departments-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './departments-list.component.html',
  styleUrl: './departments-list.component.css',
})
export class DepartmentsListComponent implements OnInit {
  private readonly service = inject(DepartmentsService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  /** All documents (active + soft-deleted) from Firestore, ordered by name. */
  private readonly firestoreData = toSignal(this.service.getAll(), { initialValue: [] });

  readonly activeKindFilter = signal<DepartmentKind | null>(null);

  /** Active departments, optionally filtered by kind. */
  readonly displayItems = computed(() => {
    const filter = this.activeKindFilter();
    const all = this.firestoreData().filter((d) => d.active);
    return filter ? all.filter((d) => d.kind === filter) : all;
  });

  /** Departments that can serve as a parent (anything except admin_sub). */
  readonly parentDepts = computed(() =>
    this.firestoreData().filter((d) => d.active && d.kind !== 'admin_sub'),
  );

  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<DepartmentModel | null>(null);

  readonly kindOptions = DEPARTMENT_KIND_OPTIONS;
  readonly kindFilterOptions: Array<{ label: string; value: DepartmentKind | null }> = [
    { label: 'All', value: null },
    ...DEPARTMENT_KIND_OPTIONS,
  ];

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      kind: ['subject', Validators.required],
      parentId: [null],
      annualBudget: [null],
      notes: [''],
    });
  }

  get isAdminSub(): boolean {
    return this.form.get('kind')?.value === 'admin_sub';
  }

  kindSeverity(kind: DepartmentKind): TagSeverity {
    const map: Record<DepartmentKind, TagSeverity> = {
      subject: 'info',
      admin: 'warn',
      admin_sub: 'secondary',
      system: 'contrast',
    };
    return map[kind];
  }

  kindLabel(kind: DepartmentKind): string {
    return DEPARTMENT_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind;
  }

  parentName(parentId: string | null): string {
    if (!parentId) return '—';
    return this.firestoreData().find((d) => d.id === parentId)?.name ?? '—';
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ kind: 'subject', parentId: null, annualBudget: null, notes: '' });
    this.dialogVisible.set(true);
  }

  openEdit(item: DepartmentModel): void {
    this.editing.set(item);
    this.form.patchValue({
      name: item.name,
      kind: item.kind,
      parentId: item.parentId,
      annualBudget: item.annualBudget,
      notes: item.notes ?? '',
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editing.set(null);
    this.form.reset({ kind: 'subject' });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue() as DepartmentFormModel;

    if (raw.kind === 'admin_sub' && !raw.parentId) {
      this.form.get('parentId')?.setErrors({ required: true });
      this.form.get('parentId')?.markAsTouched();
      return;
    }

    this.saving.set(true);
    const payload: DepartmentFormModel = {
      ...raw,
      parentId: raw.kind === 'admin_sub' ? raw.parentId : null,
      notes: raw.notes || null,
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

  confirmDelete(item: DepartmentModel): void {
    this.confirm.confirm({
      header: 'Delete department',
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
