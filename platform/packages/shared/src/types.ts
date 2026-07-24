export type MembershipRole =
  | 'super_admin'
  | 'franchisor'
  | 'franchisee'
  | 'admin'
  | 'manager'
  | 'reception'
  | 'trainer'
  | 'student';

export type SystemRoleSlug =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'reception'
  | 'finance'
  | 'trainer'
  | 'personal'
  | 'student';

export type ProfileStatus = 'active' | 'inactive' | 'invited';

export interface Company {
  id: string;
  name: string;
  legalName: string | null;
  document: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Unit {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  city: string | null;
  state: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Profile {
  id: string;
  companyId: string | null;
  defaultUnitId: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: ProfileStatus | string;
  lastLoginAt: string | null;
  locale: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** @deprecated Prefer user_roles + Role. Kept for Sprint 0 compatibility. */
export interface Membership {
  id: string;
  profileId: string;
  companyId: string;
  unitId: string | null;
  role: MembershipRole;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string | null;
}

export interface Role {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface UserRole {
  id: string;
  profileId: string;
  roleId: string;
  companyId: string;
  unitId: string | null;
  role?: Role;
}

export interface Invite {
  id: string;
  companyId: string;
  unitId: string | null;
  roleId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  token: string;
  status: string;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  companyId: string | null;
  userId: string | null;
  module: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ip: string | null;
  browser: string | null;
  createdAt: string;
}

export interface AuthContext {
  userId: string;
  email: string | null;
  companyId: string | null;
  companyIds: string[];
  defaultUnitId: string | null;
  unitIds: string[];
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  status: string;
}

export interface MeResponse {
  profile: Profile;
  memberships: Membership[];
  companies: Company[];
  units: Unit[];
  roles: Role[];
  permissions: string[];
  auth: AuthContext;
}

export interface UserListItem {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  roles: string[];
  unitIds: string[];
}

export type StudentStatus =
  | 'lead'
  | 'pre_registration'
  | 'active'
  | 'delinquent'
  | 'blocked'
  | 'cancelled'
  | 'archived';

export interface StudentAddress {
  id: string;
  studentId: string;
  zipcode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface EmergencyContact {
  id: string;
  studentId: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  type: string;
  storagePath: string;
  fileName: string | null;
  uploadedAt: string;
}

export interface StudentStatusHistory {
  id: string;
  studentId: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Student {
  id: string;
  companyId: string;
  unitId: string;
  legacyAlunoId: number | null;
  registrationNumber: string;
  fullName: string;
  socialName: string | null;
  cpf: string | null;
  rg: string | null;
  birthDate: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  photoUrl: string | null;
  status: StudentStatus | string;
  planName: string | null;
  trainerName: string | null;
  notes: string | null;
  lastAccessAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  address?: StudentAddress | null;
  emergencyContacts?: EmergencyContact[];
  documents?: StudentDocument[];
}

export interface StudentListItem {
  id: string;
  fullName: string;
  cpf: string | null;
  registrationNumber: string;
  planName: string | null;
  status: string;
  unitId: string;
  phone: string | null;
  lastAccessAt: string | null;
  photoUrl: string | null;
}

export interface StudentListResponse {
  items: StudentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StudentFilters {
  q?: string;
  name?: string;
  cpf?: string;
  registration?: string;
  phone?: string;
  email?: string;
  status?: string;
  unitId?: string;
  page?: number;
  pageSize?: number;
}

export type LeadActivityType =
  | 'call'
  | 'visit'
  | 'trial'
  | 'follow_up'
  | 'negotiation'
  | 'note';

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';
export type EnrollmentStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface LeadSource {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
}

export interface PipelineStage {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
}

export interface Lead {
  id: string;
  companyId: string;
  unitId: string | null;
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  sourceId: string | null;
  stageId: string | null;
  status: string;
  assignedTo: string | null;
  interest: string | null;
  notes: string | null;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType | string;
  description: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Plan {
  id: string;
  companyId: string;
  name: string;
  category: string | null;
  durationDays: number;
  price: number;
  enrollmentFee: number;
  active: boolean;
}

export interface Enrollment {
  id: string;
  companyId: string;
  studentId: string;
  planId: string;
  leadId: string | null;
  contractId: string | null;
  salespersonId: string | null;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus | string;
}

export interface Contract {
  id: string;
  companyId: string;
  studentId: string | null;
  planId: string;
  enrollmentId: string | null;
  leadId: string | null;
  contractNumber: string;
  signedAt: string | null;
  pdfUrl: string | null;
  status: ContractStatus | string;
  createdAt: string;
}

export interface PipelineColumn {
  stage: PipelineStage;
  leads: Lead[];
}

export interface SalesDashboard {
  newLeads: number;
  scheduledVisits: number;
  enrollments: number;
  conversionRate: number;
}

export const LEAD_ACTIVITY_TYPES: LeadActivityType[] = [
  'call',
  'visit',
  'trial',
  'follow_up',
  'negotiation',
  'note',
];

export function calcConversionRate(won: number, totalLeads: number): number {
  if (totalLeads <= 0) return 0;
  return Math.round((won / totalLeads) * 1000) / 10;
}

// Finance types re-exported from helpers module for convenience
export type {
  ReceivableStatus,
  PayableStatus,
  SubscriptionStatus,
  SubscriptionRecurrence,
  PaymentGateway,
  PaymentTxStatus,
  CashDirection,
  OutboxStatus,
  FinancialAccount,
  CostCenter,
  PaymentMethod,
  Supplier,
  FinanceSubscription,
  Receivable,
  Payable,
  PaymentTransaction,
  CashflowPoint,
  DreReport,
  FinanceDashboard,
  OutboxEvent,
} from './finance/helpers';

