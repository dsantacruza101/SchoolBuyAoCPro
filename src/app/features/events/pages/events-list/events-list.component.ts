import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { StaffService } from '../../../staff/services';
import { EventsService } from '../../services';
import {
  CURRENT_FISCAL_YEAR,
  EVENT_KIND_OPTIONS,
  EventFormModel,
  EventKind,
  EventModel,
} from '../../models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DatePickerModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TagModule,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.css',
})
export class EventsListComponent implements OnInit {
  private readonly service = inject(EventsService);
  private readonly staffService = inject(StaffService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  private readonly firestoreData = toSignal(this.service.getAll(), { initialValue: [] });
  private readonly allStaff = toSignal(this.staffService.getAll(), { initialValue: [] });

  readonly displayItems = computed(() => this.firestoreData().filter((e) => e.active));

  readonly staffOptions = computed(() =>
    this.allStaff()
      .filter((s) => s.active)
      .map((s) => ({ label: s.name, value: s.id })),
  );

  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<EventModel | null>(null);

  readonly kindOptions = EVENT_KIND_OPTIONS;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name:           ['', Validators.required],
      kind:           ['one_shot', Validators.required],
      description:    [''],
      fiscalYear:     [CURRENT_FISCAL_YEAR, Validators.required],
      startDate:      [null],
      endDate:        [null],
      budget:         [0, [Validators.required, Validators.min(0)]],
      ownerStaffId:   [null],
      participantIds: [[]],
    });
  }

  kindSeverity(kind: EventKind): TagSeverity {
    return kind === 'annual' ? 'success' : 'info';
  }

  kindLabel(kind: EventKind): string {
    return kind === 'annual' ? 'Annual' : 'One-shot';
  }

  participantCount(item: EventModel): number {
    return item.participantIds?.length ?? 0;
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '', kind: 'one_shot', description: '', fiscalYear: CURRENT_FISCAL_YEAR,
      startDate: null, endDate: null, budget: 0, ownerStaffId: null, participantIds: [],
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: EventModel): void {
    this.editing.set(item);
    this.form.patchValue({
      name:           item.name,
      kind:           item.kind,
      description:    item.description ?? '',
      fiscalYear:     item.fiscalYear,
      startDate:      item.startDate ? item.startDate.toDate() : null,
      endDate:        item.endDate   ? item.endDate.toDate()   : null,
      budget:         item.budget,
      ownerStaffId:   item.ownerStaffId,
      participantIds: item.participantIds ?? [],
    });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editing.set(null);
    this.form.reset();
  }

  async save(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    const raw = this.form.getRawValue();

    const ownerStaff = raw.ownerStaffId
      ? this.allStaff().find((s) => s.id === raw.ownerStaffId)
      : null;

    const payload: EventFormModel = {
      name:           raw.name,
      kind:           raw.kind,
      description:    raw.description || null,
      fiscalYear:     raw.fiscalYear,
      startDate:      raw.startDate ?? null,
      endDate:        raw.endDate   ?? null,
      budget:         raw.budget ?? 0,
      ownerStaffId:   raw.ownerStaffId ?? null,
      ownerStaffName: ownerStaff?.name ?? null,
      participantIds: raw.participantIds ?? [],
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

  confirmDelete(item: EventModel): void {
    this.confirm.confirm({
      header: 'Delete event',
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
