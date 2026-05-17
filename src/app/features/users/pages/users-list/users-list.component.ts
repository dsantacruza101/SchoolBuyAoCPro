import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';

import { RolesService } from '../../../roles/services';
import { UsersService } from '../../services';
import { CreateInviteDto, InviteModel, UserMembershipModel } from '../../models';

/**
 * Users & Access management page (`/users`).
 *
 * Displays all school members in a live table. Administrators can:
 * - Change a member's role via an inline dropdown.
 * - Enable / disable a member with the active toggle.
 * - Invite new users by email.
 * - Revoke pending invites.
 *
 * Guardrails enforced here (Cloud Functions will enforce server-side once deployed):
 * - Cannot change the role of the last active admin away from `admin`.
 * - Cannot disable the last active admin.
 */
@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    AvatarModule,
    BadgeModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToggleSwitchModule,
    TooltipModule,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css',
})
export class UsersListComponent {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly msg = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly fb = inject(FormBuilder);

  /** Live stream of school members, ordered by displayName. */
  readonly members = toSignal(this.usersService.getMembers(), { initialValue: [] });

  /** Live stream of pending invites, ordered by email. */
  readonly pendingInvites = toSignal(this.usersService.getPendingInvites(), { initialValue: [] });

  /** All roles — used as options in the role-change select and invite dialog. */
  readonly roles = toSignal(this.rolesService.getAll(), { initialValue: [] });

  /** Controls visibility of the invite dialog. */
  readonly inviteDialogVisible = signal(false);

  /** True while an async operation (invite / role change) is in flight. */
  readonly saving = signal(false);

  /** Reactive form for the invite dialog. */
  readonly inviteForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    roleId: [null, Validators.required],
  });

  /**
   * Returns `true` if the given member is the only active admin.
   * Used to block role changes and disabling for that member.
   *
   * @param member - The membership to inspect.
   */
  isLastActiveAdmin(member: UserMembershipModel): boolean {
    if (member.roleCode !== 'admin') return false;
    const activeAdmins = this.members().filter((m) => m.roleCode === 'admin' && m.active);
    return activeAdmins.length === 1;
  }

  /**
   * Returns the uppercase initials (up to 2 chars) from a display name,
   * used as the avatar fallback label.
   *
   * @param name - The member's display name.
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /** Opens the invite dialog and resets its form. */
  openInviteDialog(): void {
    this.inviteForm.reset();
    this.inviteDialogVisible.set(true);
  }

  /** Closes the invite dialog. */
  closeInviteDialog(): void {
    this.inviteDialogVisible.set(false);
    this.inviteForm.reset();
  }

  /**
   * Validates and submits the invite form, then closes the dialog on success.
   */
  async sendInvite(): Promise<void> {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { email, roleId } = this.inviteForm.getRawValue() as { email: string; roleId: string };
    const selectedRole = this.roles().find((r) => r.id === roleId);

    const dto: CreateInviteDto = {
      email,
      roleId,
      roleCode: selectedRole?.code ?? '',
    };

    try {
      await this.usersService.invite(dto);
      this.msg.add({ severity: 'success', summary: 'Invite sent', detail: email });
      this.closeInviteDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not send invite. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Changes the role on a membership.
   * Blocks the change if it would remove the last active admin.
   *
   * @param member - The membership to update.
   * @param roleId - New role document ID selected from the dropdown.
   */
  async changeRole(member: UserMembershipModel, roleId: string): Promise<void> {
    const selectedRole = this.roles().find((r) => r.id === roleId);
    if (!selectedRole) return;

    if (member.roleCode === 'admin' && selectedRole.code !== 'admin' && this.isLastActiveAdmin(member)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Protected member',
        detail: 'Cannot change the role of the last active admin.',
      });
      return;
    }

    try {
      await this.usersService.updateRole(member.id, selectedRole.id, selectedRole.code);
      this.msg.add({ severity: 'success', summary: 'Role updated', detail: member.displayName });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not update role.' });
    }
  }

  /**
   * Toggles the active flag on a membership.
   * Blocks disabling if the member is the last active admin.
   *
   * @param member - The membership to toggle.
   * @param active - The new active state from the toggle switch.
   */
  async toggleActive(member: UserMembershipModel, active: boolean): Promise<void> {
    if (!active && this.isLastActiveAdmin(member)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Protected member',
        detail: 'Cannot disable the last active admin.',
      });
      return;
    }

    try {
      await this.usersService.setActive(member.id, active);
      this.msg.add({
        severity: 'success',
        summary: active ? 'Member enabled' : 'Member disabled',
        detail: member.displayName,
      });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not update status.' });
    }
  }

  /**
   * Prompts for confirmation then revokes a pending invite.
   *
   * @param invite - The invite to revoke.
   */
  confirmRevoke(invite: InviteModel): void {
    this.confirm.confirm({
      header: 'Revoke invite',
      message: `Revoke invite for ${invite.email}?`,
      icon: 'pi pi-times-circle',
      acceptLabel: 'Revoke',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await this.usersService.revokeInvite(invite.id);
          this.msg.add({ severity: 'success', summary: 'Invite revoked', detail: invite.email });
        } catch {
          this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not revoke invite.' });
        }
      },
    });
  }
}
