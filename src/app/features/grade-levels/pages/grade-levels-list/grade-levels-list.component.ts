import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { GradeLevelsService } from '../../services';
import { GradeLevelFormModel, GradeLevelModel } from '../../models';

/**
 * Grade Levels management page (`/grade-levels`).
 *
 * Lists all grade levels ordered by `sortOrder`. Administrators can
 * create, edit, and delete entries via an inline dialog.
 */
@Component({
  selector: 'app-grade-levels-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
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

  /** Live stream of all grade levels, ordered by sortOrder. */
  readonly gradeLevels = toSignal(this.service.getAll(), { initialValue: [] });

  /** Controls dialog visibility. */
  readonly dialogVisible = signal(false);

  /** True while a save is in flight. */
  readonly saving = signal(false);

  /** The grade level being edited, or `null` when creating. */
  readonly editing = signal<GradeLevelModel | null>(null);

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      sortOrder: [100, [Validators.required, Validators.min(0)]],
    });
  }

  /** Opens the dialog in create mode. */
  openCreate(): void {
    this.editing.set(null);
    this.form.reset({ sortOrder: 100 });
    this.dialogVisible.set(true);
  }

  /**
   * Opens the dialog in edit mode for an existing grade level.
   *
   * @param item - The grade level to load into the form.
   */
  openEdit(item: GradeLevelModel): void {
    this.editing.set(item);
    this.form.patchValue({ name: item.name, sortOrder: item.sortOrder });
    this.dialogVisible.set(true);
  }

  /** Closes and resets the dialog. */
  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editing.set(null);
    this.form.reset({ sortOrder: 100 });
  }

  /** Saves the form — creates or updates depending on `editing()`. */
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.form.getRawValue() as GradeLevelFormModel;
    const item = this.editing();

    try {
      if (item) {
        await this.service.update(item.id, payload);
        this.msg.add({ severity: 'success', summary: 'Updated', detail: payload.name });
      } else {
        await this.service.create(payload);
        this.msg.add({ severity: 'success', summary: 'Created', detail: payload.name });
      }
      this.closeDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Prompts for confirmation then deletes the grade level.
   *
   * @param item - The grade level to delete.
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
