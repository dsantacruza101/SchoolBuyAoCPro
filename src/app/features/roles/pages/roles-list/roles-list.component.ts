import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { BadgeModule } from 'primeng/badge';

import { RolesService } from '../../services';
import { RoleFormModel, RoleModel } from '../../models';
import { ADMIN_REQUIRED_CAP, CAPS_CATALOG, CapGroup } from '../../constants';

/**
 * Roles & Permissions management page (`/roles`).
 *
 * Displays all roles in a PrimeNG table. Administrators can:
 * - Edit any role's name, description, and capability set.
 * - Create custom roles.
 * - Delete custom roles that have no active members.
 *
 * Guardrails enforced in this component (Cloud Functions will enforce
 * the same rules server-side once deployed):
 * - System roles: `code` is read-only and the row cannot be deleted.
 * - The `admin` role cannot have `roles.manage` removed from its capabilities.
 * - A role with `memberCount > 0` cannot be deleted.
 */
@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    BadgeModule,
  ],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.css',
})
export class RolesListComponent implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  /** Live stream of all roles from Firestore. */
  readonly roles = toSignal(this.rolesService.getAll(), { initialValue: [] });

  /** Whether the create/edit dialog is visible. */
  readonly dialogVisible = signal(false);

  /** Whether a save operation is in flight. */
  readonly saving = signal(false);

  /** The role currently being edited, or `null` when creating. */
  readonly editingRole = signal<RoleModel | null>(null);

  /** Capability groups for the checkbox grid. */
  readonly capGroups: CapGroup[] = CAPS_CATALOG;

  /**
   * Boolean map used for two-way checkbox binding — keeps the capability
   * grid outside the reactive FormGroup to avoid the NG01350 conflict.
   * Keys are capability strings; values are `true` when the role holds that cap.
   */
  capMap: Record<string, boolean> = {};

  /** Reactive form for the create/edit dialog (name, code, description only). */
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  /** Initialises the dialog form with empty values. */
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      description: [''],
      sortOrder: [100],
    });
  }

  /** Builds `capMap` from a capabilities array. */
  private buildCapMap(caps: string[]): void {
    this.capMap = {};
    for (const group of CAPS_CATALOG) {
      for (const entry of group.caps) {
        this.capMap[entry.cap] = caps.includes(entry.cap);
      }
    }
  }

  /** Derives the capabilities string array from the current `capMap`. */
  private capsFromMap(): string[] {
    return Object.entries(this.capMap)
      .filter(([, checked]) => checked)
      .map(([cap]) => cap);
  }

  /**
   * Opens the dialog in edit mode for an existing role.
   *
   * @param role - The role to load into the form.
   */
  openEdit(role: RoleModel): void {
    this.editingRole.set(role);
    this.form.patchValue({
      name: role.name,
      code: role.code,
      description: role.description,
      sortOrder: role.sortOrder,
    });
    this.buildCapMap(role.capabilities ?? []);
    if (role.isSystem) {
      this.form.get('code')?.disable();
    } else {
      this.form.get('code')?.enable();
    }
    this.dialogVisible.set(true);
  }

  /** Opens the dialog in create mode. */
  openCreate(): void {
    this.editingRole.set(null);
    this.form.reset({ sortOrder: 100 });
    this.form.get('code')?.enable();
    this.buildCapMap([]);
    this.dialogVisible.set(true);
  }

  /** Closes the dialog and resets state. */
  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editingRole.set(null);
    this.form.reset({ sortOrder: 100 });
    this.buildCapMap([]);
  }

  /**
   * Handles a checkbox `ngModelChange` event.
   * Prevents removing `roles.manage` from the `admin` role.
   *
   * @param cap - Capability string being toggled.
   * @param checked - New checked state from the checkbox.
   */
  onCapToggle(cap: string, checked: boolean): void {
    if (this.editingRole()?.code === 'admin' && cap === ADMIN_REQUIRED_CAP && !checked) {
      this.msg.add({
        severity: 'warn',
        summary: 'Protected capability',
        detail: `The admin role must always retain "${ADMIN_REQUIRED_CAP}".`,
      });
      this.capMap[cap] = true;
      return;
    }
    this.capMap[cap] = checked;
  }

  /**
   * Handles a row-level click by toggling the capability via `onCapToggle`.
   *
   * @param cap - Capability string to toggle.
   */
  toggleCap(cap: string): void {
    this.onCapToggle(cap, !this.capMap[cap]);
  }

  /** Saves the form — creates a new role or updates the existing one. */
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const formValue = this.form.getRawValue();
    const capabilities = this.capsFromMap();
    const role = this.editingRole();

    try {
      if (role) {
        const payload: Partial<RoleFormModel> = {
          name: formValue['name'],
          description: formValue['description'],
          capabilities,
          sortOrder: formValue['sortOrder'],
        };
        if (!role.isSystem) {
          payload.code = formValue['code'];
        }
        await this.rolesService.update(role.id, payload);
        this.msg.add({ severity: 'success', summary: 'Role updated', detail: role.name });
      } else {
        await this.rolesService.create({ ...formValue, capabilities } as RoleFormModel);
        this.msg.add({ severity: 'success', summary: 'Role created', detail: formValue['name'] });
      }
      this.closeDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save role. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Prompts for confirmation then deletes the role.
   * Only callable for non-system roles with `memberCount === 0`.
   *
   * @param role - The role to delete.
   */
  confirmDelete(role: RoleModel): void {
    this.confirm.confirm({
      header: 'Delete role',
      message: `Delete "${role.name}"? This cannot be undone.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.rolesService.delete(role.id);
          this.msg.add({ severity: 'success', summary: 'Role deleted', detail: role.name });
        } catch {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not delete role.' });
        }
      },
    });
  }

  /**
   * Returns the tooltip shown on the delete button when deletion is blocked.
   *
   * @param role - The role to inspect.
   */
  deleteTooltip(role: RoleModel): string {
    if (role.isSystem) return 'System roles cannot be deleted';
    if (role.memberCount > 0) return `Reassign the ${role.memberCount} member(s) first`;
    return 'Delete role';
  }

  /**
   * Returns `true` when the delete button should be disabled.
   *
   * @param role - The role to inspect.
   */
  cannotDelete(role: RoleModel): boolean {
    return role.isSystem || role.memberCount > 0;
  }
}
