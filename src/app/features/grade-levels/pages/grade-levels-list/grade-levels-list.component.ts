import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { GradeLevelsService } from '../../services';
import { GradeLevelFormModel, GradeLevelModel } from '../../models';

/**
 * Grade Levels management page (`/grade-levels`).
 *
 * Sort order is managed automatically:
 * - New items are appended at the end (max sortOrder + 10).
 * - Users reorder rows via drag-and-drop; changes are committed atomically
 *   via a Firestore WriteBatch so only one snapshot fires.
 *
 * `toSignal()` is used throughout to keep state reactive and avoid
 * ExpressionChangedAfterItHasBeenCheckedError (NG0100).
 */
@Component({
  selector: 'app-grade-levels-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './grade-levels-list.component.html',
  styleUrl: './grade-levels-list.component.css',
})
export class GradeLevelsListComponent implements OnInit {
  private readonly service = inject(GradeLevelsService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  /** Live Firestore data, ordered by sortOrder. */
  private readonly firestoreData = toSignal(this.service.getAll(), { initialValue: [] });

  /**
   * Holds the locally-reordered array while a drag-and-drop write is in flight,
   * preventing the live snapshot from showing intermediate Firestore states.
   * Cleared once the WriteBatch is confirmed.
   */
  private readonly optimisticOrder = signal<GradeLevelModel[] | null>(null);

  /** What the table renders — optimistic state when reordering, Firestore otherwise. */
  readonly displayItems = computed(() => this.optimisticOrder() ?? this.firestoreData());

  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<GradeLevelModel | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
    });
  }

  /** Opens the dialog in create mode. */
  openCreate(): void {
    this.editing.set(null);
    this.form.reset();
    this.dialogVisible.set(true);
  }

  /**
   * Opens the dialog in edit mode.
   *
   * @param item - Grade level to load into the form.
   */
  openEdit(item: GradeLevelModel): void {
    this.editing.set(item);
    this.form.patchValue({ name: item.name });
    this.dialogVisible.set(true);
  }

  /** Closes and resets the dialog. */
  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editing.set(null);
    this.form.reset();
  }

  /** Saves the form — creates (appended at end) or updates name only. */
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { name } = this.form.getRawValue() as { name: string };
    const item = this.editing();

    try {
      if (item) {
        await this.service.update(item.id, { name });
        this.msg.add({ severity: 'success', summary: 'Updated', detail: name });
      } else {
        const data = this.firestoreData();
        const nextSortOrder = data.length > 0
          ? Math.max(...data.map((i) => i.sortOrder)) + 10
          : 10;
        await this.service.create({ name, sortOrder: nextSortOrder });
        this.msg.add({ severity: 'success', summary: 'Created', detail: name });
      }
      this.closeDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Fires after PrimeNG mutates `displayItems` in-place via drag-and-drop.
   * Reads the already-reordered array, sets optimistic state, then commits
   * all sortOrder updates atomically via a WriteBatch (one snapshot, no flicker).
   */
  async onRowReorder(): Promise<void> {
    const reordered = [...this.displayItems()];
    this.optimisticOrder.set(reordered);
    try {
      await this.service.reorder(reordered);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save order.' });
    } finally {
      this.optimisticOrder.set(null);
    }
  }

  /**
   * Prompts for confirmation then deletes the grade level.
   *
   * @param item - Grade level to delete.
   */
  confirmDelete(item: GradeLevelModel): void {
    this.confirm.confirm({
      header: 'Delete grade level',
      message: `Delete "${item.name}"? This cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.service.delete(item.id);
          this.msg.add({ severity: 'success', summary: 'Deleted', detail: item.name });
        } catch {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not delete.' });
        }
      },
    });
  }
}
