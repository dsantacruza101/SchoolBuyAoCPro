import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { DepartmentsService } from '../../../departments/services';
import { StaffService } from '../../../staff/services';
import { BudgetsService } from '../../services';
import { BudgetAdjustForm, BudgetHealth, DepartmentBudgetRow, RollupModel, StaffBudgetRow } from '../../models';
import { DepartmentModel } from '../../../departments/models';
import { StaffModel } from '../../../staff/models';

type EditTarget = { kind: 'dept'; item: DepartmentBudgetRow } | { kind: 'staff'; item: StaffBudgetRow };

@Component({
  selector: 'app-budgets-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    PercentPipe,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    TextareaModule,
    TooltipModule,
  ],
  templateUrl: './budgets-list.component.html',
  styleUrl: './budgets-list.component.css',
})
export class BudgetsListComponent implements OnInit {
  private readonly deptService = inject(DepartmentsService);
  private readonly staffService = inject(StaffService);
  private readonly budgetsService = inject(BudgetsService);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  private readonly allDepts = toSignal(this.deptService.getAll(), { initialValue: [] });
  private readonly allStaff = toSignal(this.staffService.getAll(), { initialValue: [] });
  private readonly rollupMap = toSignal(this.budgetsService.getRollupMap(), { initialValue: new Map() });

  readonly deptRows = computed<DepartmentBudgetRow[]>(() => {
    const depts = this.allDepts().filter((d) => d.active && d.kind !== 'admin_sub');
    const rollups = this.rollupMap();
    return depts.map((d) => this.toDeptRow(d, rollups));
  });

  readonly staffRows = computed<StaffBudgetRow[]>(() =>
    this.allStaff()
      .filter((s) => s.active)
      .map((s) => this.toStaffRow(s)),
  );

  readonly totalDeptBudget = computed(() =>
    this.deptRows().reduce((sum, r) => sum + r.annualBudget, 0),
  );

  readonly totalDeptCommitted = computed(() =>
    this.deptRows().reduce((sum, r) => sum + r.committed, 0),
  );

  readonly totalStaffBudget = computed(() =>
    this.staffRows().reduce((sum, r) => sum + r.personalBudget, 0),
  );

  readonly dialogVisible = signal(false);
  readonly saving = signal(false);
  readonly editTarget = signal<EditTarget | null>(null);

  adjustForm!: FormGroup;

  ngOnInit(): void {
    this.adjustForm = this.fb.group({
      newAmount: [0, [Validators.required, Validators.min(0)]],
      reason: [''],
    });
  }

  private toDeptRow(d: DepartmentModel, rollups: Map<string, RollupModel>): DepartmentBudgetRow {
    const rollup = rollups.get(d.id);
    const annualBudget = d.annualBudget ?? 0;
    if (rollup) {
      return {
        id: d.id,
        name: d.name,
        kind: d.kind,
        annualBudget,
        committed: rollup.committed,
        ordered: rollup.ordered,
        pending: rollup.pending,
        available: rollup.available,
        pctCommitted: rollup.pctCommitted,
        health: rollup.health,
        hasRollup: true,
      };
    }
    return {
      id: d.id,
      name: d.name,
      kind: d.kind,
      annualBudget,
      committed: 0,
      ordered: 0,
      pending: 0,
      available: annualBudget,
      pctCommitted: 0,
      health: 'healthy',
      hasRollup: false,
    };
  }

  private toStaffRow(s: StaffModel): StaffBudgetRow {
    return {
      id: s.id,
      name: s.name,
      departmentName: s.departmentName,
      personalBudget: s.personalBudget ?? 0,
    };
  }

  healthSeverity(health: BudgetHealth): string {
    const map: Record<BudgetHealth, string> = {
      healthy: 'budgets-health--healthy',
      warning: 'budgets-health--warning',
      critical: 'budgets-health--critical',
    };
    return map[health];
  }

  healthLabel(health: BudgetHealth): string {
    const map: Record<BudgetHealth, string> = {
      healthy: 'Healthy',
      warning: 'Warning',
      critical: 'Critical',
    };
    return map[health];
  }

  openAdjustDept(row: DepartmentBudgetRow): void {
    this.editTarget.set({ kind: 'dept', item: row });
    this.adjustForm.reset({ newAmount: row.annualBudget, reason: '' });
    this.dialogVisible.set(true);
  }

  openAdjustStaff(row: StaffBudgetRow): void {
    this.editTarget.set({ kind: 'staff', item: row });
    this.adjustForm.reset({ newAmount: row.personalBudget, reason: '' });
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.editTarget.set(null);
    this.adjustForm.reset();
  }

  async save(): Promise<void> {
    if (this.adjustForm.invalid) { this.adjustForm.markAllAsTouched(); return; }

    this.saving.set(true);
    const raw = this.adjustForm.getRawValue() as BudgetAdjustForm;
    const target = this.editTarget();

    try {
      if (target?.kind === 'dept') {
        await this.deptService.update(target.item.id, {
          annualBudget: raw.newAmount,
          notes: raw.reason || null,
        });
        this.msg.add({ severity: 'success', summary: 'Budget updated', detail: target.item.name });
      } else if (target?.kind === 'staff') {
        await this.staffService.update(target.item.id, { personalBudget: raw.newAmount });
        this.msg.add({ severity: 'success', summary: 'Budget updated', detail: target.item.name });
      }
      this.closeDialog();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not save. Try again.' });
    } finally {
      this.saving.set(false);
    }
  }

  dialogHeader(): string {
    const target = this.editTarget();
    if (!target) return '';
    const name = target.kind === 'dept' ? target.item.name : target.item.name;
    return `Adjust Budget — ${name}`;
  }
}
