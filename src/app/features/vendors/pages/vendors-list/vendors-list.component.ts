import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

import { VendorsService } from '../../services';
import {
  VENDOR_STATUS_OPTIONS,
  VENDOR_TERMS_OPTIONS,
  VendorFormModel,
  VendorModel,
  VendorStatus,
} from '../../models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-vendors-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './vendors-list.component.html',
  styleUrl: './vendors-list.component.css',
})
export class VendorsListComponent implements OnInit {
  private readonly service = inject(VendorsService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  private readonly firestoreData = toSignal(this.service.getAll(), { initialValue: [] });

  /** Active vendors ordered by name. */
  readonly displayItems = computed(() => this.firestoreData().filter((v) => v.active));

  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<VendorModel | null>(null);

  readonly statusOptions = VENDOR_STATUS_OPTIONS;
  readonly termsOptions = VENDOR_TERMS_OPTIONS;

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      website: [''],
      category: [''],
      terms: [null],
      status: ['active', Validators.required],
      account: [''],
      contactName: [''],
      contactEmail: [''],
      contactPhone: [''],
      notes: [''],
      isApprovedForAutoApprove: [false],
    });
  }

  statusSeverity(status: VendorStatus): TagSeverity {
    const map: Record<VendorStatus, TagSeverity> = {
      preferred: 'success',
      active: 'info',
      setup: 'warn',
      inactive: 'secondary',
    };
    return map[status];
  }

  statusLabel(status: VendorStatus): string {
    return VENDOR_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  }

  async toggleAutoApprove(item: VendorModel, value: boolean): Promise<void> {
    try {
      await this.service.update(item.id, { isApprovedForAutoApprove: value });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not update.' });
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      name: '', website: '', category: '', terms: null, status: 'active',
      account: '', contactName: '', contactEmail: '', contactPhone: '',
      notes: '', isApprovedForAutoApprove: false,
    });
    this.dialogVisible.set(true);
  }

  openEdit(item: VendorModel): void {
    this.editing.set(item);
    this.form.patchValue({
      name: item.name,
      website: item.website ?? '',
      category: item.category ?? '',
      terms: item.terms,
      status: item.status,
      account: item.account ?? '',
      contactName: item.contactName ?? '',
      contactEmail: item.contactEmail ?? '',
      contactPhone: item.contactPhone ?? '',
      notes: item.notes ?? '',
      isApprovedForAutoApprove: item.isApprovedForAutoApprove,
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
    const payload: VendorFormModel = {
      name: raw.name,
      website: raw.website || null,
      category: raw.category || null,
      terms: raw.terms ?? null,
      status: raw.status,
      account: raw.account || null,
      contactName: raw.contactName || null,
      contactEmail: raw.contactEmail || null,
      contactPhone: raw.contactPhone || null,
      notes: raw.notes || null,
      isApprovedForAutoApprove: raw.isApprovedForAutoApprove ?? false,
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

  confirmDelete(item: VendorModel): void {
    this.confirm.confirm({
      header: 'Delete vendor',
      message: `Delete "${item.name}"? Consider setting the status to "Inactive" instead to preserve purchase history.`,
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
