import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { RequestsService } from '../../services';
import { RequestModel } from '../../models';
import { StatusesService } from '../../../settings/services';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-requests-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './requests-list.component.html',
  styleUrl: './requests-list.component.css',
})
export class RequestsListComponent {
  private readonly requestsService = inject(RequestsService);
  private readonly statusesService = inject(StatusesService);

  private readonly allRequests = toSignal(this.requestsService.getAll(), { initialValue: [] });
  private readonly allStatuses = toSignal(this.statusesService.getAll(), { initialValue: [] });

  readonly searchQuery   = signal('');
  readonly selectedStatus = signal<string | null>(null);
  readonly selectedDept   = signal<string | null>(null);

  readonly statusOptions = computed(() => {
    const active = this.allStatuses().filter((s) => s.active);
    return [
      { label: 'All Statuses', value: null },
      ...active.map((s) => ({ label: s.label, value: s.code })),
    ];
  });

  /** Unique departments derived from live request data. */
  readonly deptOptions = computed(() => {
    const map = new Map<string, string>();
    for (const r of this.allRequests()) {
      if (r.departmentId && r.departmentName) map.set(r.departmentId, r.departmentName);
    }
    const opts = Array.from(map.entries())
      .map(([id, name]) => ({ label: name, value: id }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ label: 'All Departments', value: null }, ...opts];
  });

  readonly filteredRequests = computed(() => {
    const q      = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const dept   = this.selectedDept();

    return this.allRequests().filter((r) => {
      if (status && r.statusCode !== status) return false;
      if (dept   && r.departmentId !== dept) return false;
      if (q) {
        const hay = [r.description, r.staffName, r.vendorName, r.departmentName, r.eventName]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  budgetSourceLabel(r: RequestModel): string {
    if (r.budgetSourceKind === 'personal') return 'Personal';
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
}
