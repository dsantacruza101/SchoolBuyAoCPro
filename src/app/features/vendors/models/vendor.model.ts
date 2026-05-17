import { Timestamp } from '@angular/fire/firestore';

export type VendorStatus = 'preferred' | 'active' | 'setup' | 'inactive';
export type VendorTerms = 'Net 30' | 'Net 45' | 'COD' | 'Prepaid';

export interface VendorModel {
  id: string;
  name: string;
  website: string | null;
  category: string | null;
  terms: VendorTerms | null;
  status: VendorStatus;
  account: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  isApprovedForAutoApprove: boolean;
  spendYTD: number;
  lastOrderAt: Timestamp | null;
  active: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  updatedByUid: string | null;
  deletedAt: Timestamp | null;
}

export interface VendorFormModel {
  name: string;
  website: string | null;
  category: string | null;
  terms: VendorTerms | null;
  status: VendorStatus;
  account: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  isApprovedForAutoApprove: boolean;
}

export const VENDOR_STATUS_OPTIONS: { label: string; value: VendorStatus }[] = [
  { label: 'Preferred', value: 'preferred' },
  { label: 'Active', value: 'active' },
  { label: 'Setup', value: 'setup' },
  { label: 'Inactive', value: 'inactive' },
];

export const VENDOR_TERMS_OPTIONS: { label: string; value: VendorTerms }[] = [
  { label: 'Net 30', value: 'Net 30' },
  { label: 'Net 45', value: 'Net 45' },
  { label: 'COD', value: 'COD' },
  { label: 'Prepaid', value: 'Prepaid' },
];
