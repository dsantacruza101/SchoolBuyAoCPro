import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

import { CategoriesService, StatusesService } from '../../services';
import { CategoryFormModel, CategoryModel, StatusFormModel, StatusModel } from '../../models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    TagModule,
    TextareaModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  private readonly catService = inject(CategoriesService);
  private readonly statusService = inject(StatusesService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  private readonly allCategories = toSignal(this.catService.getAll(), { initialValue: [] });
  private readonly allStatuses = toSignal(this.statusService.getAll(), { initialValue: [] });

  readonly categories = computed(() => this.allCategories().filter((c) => c.active));
  readonly statuses = computed(() => this.allStatuses().filter((s) => s.active));

  // ── Category dialog ────────────────────────────────────────────────────────

  readonly catDialogVisible = signal(false);
  readonly catSaving = signal(false);
  readonly editingCat = signal<CategoryModel | null>(null);

  catForm!: FormGroup;

  // ── Status dialog ──────────────────────────────────────────────────────────

  readonly statusDialogVisible = signal(false);
  readonly statusSaving = signal(false);
  readonly editingStatus = signal<StatusModel | null>(null);

  statusForm!: FormGroup;

  ngOnInit(): void {
    this.catForm = this.fb.group({
      code:      ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      label:     ['', Validators.required],
      color:     ['#6366f1', Validators.required],
      sortOrder: [1, [Validators.required, Validators.min(1)]],
    });

    this.statusForm = this.fb.group({
      code:       ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      label:      ['', Validators.required],
      color:      ['#6366f1', Validators.required],
      isTerminal: [false],
      sortOrder:  [1, [Validators.required, Validators.min(1)]],
    });
  }

  // ── Category helpers ───────────────────────────────────────────────────────

  openCreateCat(): void {
    this.editingCat.set(null);
    this.catForm.reset({ code: '', label: '', color: '#6366f1', sortOrder: 1 });
    this.catForm.get('code')?.enable();
    this.catDialogVisible.set(true);
  }

  openEditCat(item: CategoryModel): void {
    this.editingCat.set(item);
    this.catForm.patchValue({
      code: item.code, label: item.label, color: item.color, sortOrder: item.sortOrder,
    });
    this.catForm.get('code')?.disable();
    this.catDialogVisible.set(true);
  }

  closeCatDialog(): void {
    this.catDialogVisible.set(false);
    this.editingCat.set(null);
    this.catForm.reset();
  }

  async saveCat(): Promise<void> {
    if (this.catForm.invalid) { this.catForm.markAllAsTouched(); return; }

    this.catSaving.set(true);
    const raw = this.catForm.getRawValue() as CategoryFormModel;
    const item = this.editingCat();

    try {
      if (item) {
        await this.catService.update(item.code, { label: raw.label, color: raw.color, sortOrder: raw.sortOrder });
        this.msg.add({ severity: 'success', summary: 'Updated', detail: raw.label });
      } else {
        await this.catService.create(raw);
        this.msg.add({ severity: 'success', summary: 'Created', detail: raw.label });
      }
      this.closeCatDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save. Try again.' });
    } finally {
      this.catSaving.set(false);
    }
  }

  confirmDeleteCat(item: CategoryModel): void {
    this.confirm.confirm({
      header: 'Delete category',
      message: `Delete "${item.label}"? This cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.catService.softDelete(item.code);
          this.msg.add({ severity: 'success', summary: 'Deleted', detail: item.label });
        } catch {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not delete.' });
        }
      },
    });
  }

  // ── Status helpers ─────────────────────────────────────────────────────────

  openCreateStatus(): void {
    this.editingStatus.set(null);
    this.statusForm.reset({ code: '', label: '', color: '#6366f1', isTerminal: false, sortOrder: 1 });
    this.statusForm.get('code')?.enable();
    this.statusDialogVisible.set(true);
  }

  openEditStatus(item: StatusModel): void {
    this.editingStatus.set(item);
    this.statusForm.patchValue({
      code: item.code, label: item.label, color: item.color,
      isTerminal: item.isTerminal, sortOrder: item.sortOrder,
    });
    this.statusForm.get('code')?.disable();
    this.statusDialogVisible.set(true);
  }

  closeStatusDialog(): void {
    this.statusDialogVisible.set(false);
    this.editingStatus.set(null);
    this.statusForm.reset();
  }

  async saveStatus(): Promise<void> {
    if (this.statusForm.invalid) { this.statusForm.markAllAsTouched(); return; }

    this.statusSaving.set(true);
    const raw = this.statusForm.getRawValue() as StatusFormModel;
    const item = this.editingStatus();

    try {
      if (item) {
        await this.statusService.update(item.code, {
          label: raw.label, color: raw.color,
          isTerminal: raw.isTerminal, sortOrder: raw.sortOrder,
        });
        this.msg.add({ severity: 'success', summary: 'Updated', detail: raw.label });
      } else {
        await this.statusService.create(raw);
        this.msg.add({ severity: 'success', summary: 'Created', detail: raw.label });
      }
      this.closeStatusDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save. Try again.' });
    } finally {
      this.statusSaving.set(false);
    }
  }

  confirmDeleteStatus(item: StatusModel): void {
    if (item.isSystem) {
      this.msg.add({ severity: 'warn', summary: 'System status', detail: 'System statuses cannot be deleted.' });
      return;
    }
    this.confirm.confirm({
      header: 'Delete status',
      message: `Delete "${item.label}"? This cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.statusService.softDelete(item.code);
          this.msg.add({ severity: 'success', summary: 'Deleted', detail: item.label });
        } catch {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not delete.' });
        }
      },
    });
  }
}
