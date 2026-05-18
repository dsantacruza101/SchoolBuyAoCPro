import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../auth/services';
import { RequestsService } from '../../services';
import { RequestModel } from '../../models';
import { StatusesService } from '../../../settings/services';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    ButtonModule,
    DividerModule,
    SkeletonModule,
    TagModule,
    TimelineModule,
    TooltipModule,
  ],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.css',
})
export class RequestDetailComponent {
  private readonly route          = inject(ActivatedRoute);
  private readonly requestsService = inject(RequestsService);
  private readonly statusesService = inject(StatusesService);
  readonly auth = inject(AuthService);
  private readonly msg = inject(MessageService);

  private readonly id$ = this.route.paramMap.pipe(
    switchMap((p) => of(p.get('id') ?? '')),
  );

  readonly request = toSignal(
    this.route.paramMap.pipe(
      switchMap((p) => {
        const id = p.get('id');
        return id ? this.requestsService.getById(id) : of(null);
      }),
    ),
    { initialValue: null },
  );

  readonly audit = toSignal(
    this.route.paramMap.pipe(
      switchMap((p) => {
        const id = p.get('id');
        return id ? this.requestsService.getAudit(id) : of([]);
      }),
    ),
    { initialValue: [] },
  );

  private readonly allStatuses = toSignal(this.statusesService.getAll(), { initialValue: [] });

  readonly saving = signal(false);

  readonly canApprove = computed(() => {
    const r = this.request();
    return !!r && r.statusCode === 'pending' && this.auth.hasCap('requests.editAny');
  });

  readonly canDeny = computed(() => {
    const r = this.request();
    return !!r && r.statusCode === 'pending' && this.auth.hasCap('requests.editAny');
  });

  readonly canMarkOrdered = computed(() => {
    const r = this.request();
    return !!r && ['approved', 'auto-approved'].includes(r.statusCode) && this.auth.hasCap('requests.editAny');
  });

  readonly canMarkReceived = computed(() => {
    const r = this.request();
    return !!r && r.statusCode === 'ordered' && this.auth.hasCap('requests.editAny');
  });

  budgetSourceLabel(r: RequestModel): string {
    if (r.budgetSourceKind === 'personal') return 'Personal Budget';
    if (r.budgetSourceKind === 'event')    return r.eventName ?? 'Event';
    return r.departmentName ?? '—';
  }

  statusLabel(code: string): string {
    return this.allStatuses().find((s) => s.code === code)?.label ?? code;
  }

  statusSeverity(code: string): TagSeverity {
    const map: Record<string, TagSeverity> = {
      'pending':       'warn',
      'approved':      'success',
      'auto-approved': 'success',
      'ordered':       'info',
      'received':      'success',
      'denied':        'danger',
    };
    return map[code] ?? 'secondary';
  }

  auditIcon(action: string): string {
    const map: Record<string, string> = {
      'pending':       'pi pi-clock',
      'approved':      'pi pi-check-circle',
      'auto-approved': 'pi pi-check-circle',
      'ordered':       'pi pi-shopping-cart',
      'received':      'pi pi-box',
      'denied':        'pi pi-times-circle',
    };
    return map[action] ?? 'pi pi-circle';
  }

  auditColor(action: string): string {
    const map: Record<string, string> = {
      'pending':       'var(--amber)',
      'approved':      'var(--gm)',
      'auto-approved': 'var(--gm)',
      'ordered':       'var(--blue)',
      'received':      'var(--gm)',
      'denied':        'var(--red)',
    };
    return map[action] ?? 'var(--g400)';
  }

  async changeStatus(toStatus: string): Promise<void> {
    const req = this.request();
    if (!req) return;

    this.saving.set(true);
    try {
      await this.requestsService.updateStatus(req.id, req.statusCode, toStatus);
      this.msg.add({ severity: 'success', summary: 'Status updated', detail: this.statusLabel(toStatus) });
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not update status. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }
}
