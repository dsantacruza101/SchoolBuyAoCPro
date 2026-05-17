import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';

import { AuthService } from '../../../auth/services';
import { CategoriesService } from '../../../settings/services';
import { DepartmentsService } from '../../../departments/services';
import { EventsService } from '../../../events/services';
import { StaffService } from '../../../staff/services';
import { VendorsService } from '../../../vendors/services';
import { RequestsService } from '../../services';
import { BUDGET_SOURCE_OPTIONS, BudgetSourceKind, RequestFormModel } from '../../models';
import { CURRENT_FISCAL_YEAR } from '../../../events/models';

@Component({
  selector: 'app-request-new',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    TextareaModule,
  ],
  templateUrl: './request-new.component.html',
  styleUrl: './request-new.component.css',
})
export class RequestNewComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catService = inject(CategoriesService);
  private readonly deptService = inject(DepartmentsService);
  private readonly eventsService = inject(EventsService);
  private readonly staffService = inject(StaffService);
  private readonly vendorService = inject(VendorsService);
  private readonly requestsService = inject(RequestsService);
  private readonly msg = inject(MessageService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly allDepts   = toSignal(this.deptService.getAll(),   { initialValue: [] });
  private readonly allStaff   = toSignal(this.staffService.getAll(),  { initialValue: [] });
  private readonly allVendors = toSignal(this.vendorService.getAll(), { initialValue: [] });
  private readonly allEvents  = toSignal(this.eventsService.getAll(), { initialValue: [] });
  private readonly allCats    = toSignal(this.catService.getAll(),    { initialValue: [] });

  readonly deptOptions = computed(() =>
    this.allDepts().filter((d) => d.active).map((d) => ({ label: d.name, value: d.id })),
  );

  readonly vendorOptions = computed(() =>
    this.allVendors().filter((v) => v.active).map((v) => ({ label: v.name, value: v.id })),
  );

  readonly eventOptions = computed(() =>
    this.allEvents().filter((e) => e.active).map((e) => ({ label: e.name, value: e.id })),
  );

  readonly categoryOptions = computed(() =>
    this.allCats().filter((c) => c.active).map((c) => ({ label: c.label, value: c.code })),
  );

  readonly currentStaff = computed(() =>
    this.allStaff().find((s) => s.uid === this.auth.user()?.uid) ?? null,
  );

  readonly budgetSourceOptions = BUDGET_SOURCE_OPTIONS;

  readonly submitting = signal(false);
  readonly submitted = signal(false);

  private readonly unitPriceSig = signal<number>(0);
  private readonly quantitySig  = signal<number>(1);
  readonly totalPrice = computed(() => this.unitPriceSig() * this.quantitySig());

  readonly budgetSourceKindSig = signal<BudgetSourceKind>('department');
  readonly isDepartment = computed(() => this.budgetSourceKindSig() === 'department');
  readonly isPersonal   = computed(() => this.budgetSourceKindSig() === 'personal');
  readonly isEvent      = computed(() => this.budgetSourceKindSig() === 'event');

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      budgetSourceKind: ['department', Validators.required],
      departmentId:     [null],
      eventId:          [null],
      vendorId:         ['', Validators.required],
      description:      ['', Validators.required],
      unitPrice:        [0, [Validators.required, Validators.min(0.01)]],
      quantity:         [1, [Validators.required, Validators.min(1)]],
      categoryCode:     [null],
      itemUrl:          [''],
      notes:            [''],
    });

    this.form.get('budgetSourceKind')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v: BudgetSourceKind) => {
        this.budgetSourceKindSig.set(v);
        this.form.get('departmentId')?.reset(null);
        this.form.get('eventId')?.reset(null);
      });

    this.form.get('unitPrice')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v: number | null) => this.unitPriceSig.set(v ?? 0));

    this.form.get('quantity')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v: number | null) => this.quantitySig.set(v ?? 1));
  }

  get budgetSourceValid(): boolean {
    if (this.isDepartment()) return !!this.form.get('departmentId')?.value;
    if (this.isEvent())      return !!this.form.get('eventId')?.value;
    return true; // personal — no picker needed
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.budgetSourceValid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const uid = this.auth.user()?.uid ?? '';

    const selectedVendor = this.allVendors().find((v) => v.id === raw.vendorId);
    const selectedDept   = this.allDepts().find((d)   => d.id === raw.departmentId);
    const selectedEvent  = this.allEvents().find((e)   => e.id === raw.eventId);
    const staff          = this.currentStaff();

    const payload: RequestFormModel = {
      budgetSourceKind: raw.budgetSourceKind,
      departmentId:    selectedDept?.id   ?? null,
      departmentName:  selectedDept?.name ?? null,
      eventId:         selectedEvent?.id   ?? null,
      eventName:       selectedEvent?.name ?? null,
      vendorId:        raw.vendorId,
      vendorName:      selectedVendor?.name ?? '',
      description:     raw.description,
      unitPrice:       raw.unitPrice,
      quantity:        raw.quantity,
      totalPrice:      this.totalPrice(),
      categoryCode:    raw.categoryCode ?? null,
      itemUrl:         raw.itemUrl || null,
      notes:           raw.notes || null,
      staffId:         staff?.id ?? null,
      staffName:       staff?.name ?? null,
      submittedByUid:  uid,
      fiscalYear:      CURRENT_FISCAL_YEAR,
    };

    try {
      await this.requestsService.create(payload);
      this.msg.add({ severity: 'success', summary: 'Request submitted', detail: `"${raw.description}" is pending approval.` });
      this.resetForm();
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Could not submit request. Try again.' });
    } finally {
      this.submitting.set(false);
    }
  }

  resetForm(): void {
    this.form.reset({
      budgetSourceKind: 'department', departmentId: null, eventId: null,
      vendorId: '', description: '', unitPrice: 0, quantity: 1,
      categoryCode: null, itemUrl: '', notes: '',
    });
    this.budgetSourceKindSig.set('department');
    this.unitPriceSig.set(0);
    this.quantitySig.set(1);
  }
}
