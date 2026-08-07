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
  tradeName?: string | null;
  document: string | null;
  status: string;
  saasStatus?: string;
  planCode?: string | null;
  activatedAt?: string | null;
  nextDueAt?: string | null;
  trialEndsAt?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundLogin?: string | null;
  theme?: string | null;
  fontFamily?: string | null;
  emailFrom?: string | null;
  emailReplyTo?: string | null;
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
  theme?: 'light' | 'dark' | 'system' | string;
  preferences?: Record<string, unknown>;
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
  metadata?: Record<string, unknown> | null;
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
  complement: string | null;
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
  maritalStatus: string | null;
  profession: string | null;
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
  trainerName: string | null;
  status: string;
  displayStatus: string;
  unitId: string;
  phone: string | null;
  whatsapp: string | null;
  lastAccessAt: string | null;
  lastCheckinAt: string | null;
  nextDueDate: string | null;
  monthlyFee: number | null;
  createdAt: string;
  photoUrl: string | null;
}

export interface Student360Summary {
  weight: number | null;
  height: number | null;
  bmi: number | null;
  lastWorkoutAt: string | null;
  lastCheckinAt: string | null;
  nextDueDate: string | null;
  monthlyFee: number | null;
  openReceivables: number;
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
  planName?: string;
  trainerName?: string;
  birthdays?: boolean;
  recentEnrollment?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDir?: string;
}

export type LeadActivityType =
  | 'call'
  | 'visit'
  | 'trial'
  | 'follow_up'
  | 'negotiation'
  | 'note';

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled';
export type EnrollmentStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'frozen';

export type PlanType =
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'day_use'
  | 'experimental'
  | 'personal'
  | 'convenio'
  | 'corporativo';

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  day_use: 'Day Use',
  experimental: 'Experimental',
  personal: 'Personal',
  convenio: 'Convênio',
  corporativo: 'Corporativo',
};

export type EnrollmentEventKind =
  | 'enrolled'
  | 'renewed'
  | 'frozen'
  | 'unfrozen'
  | 'cancelled'
  | 'upgraded'
  | 'downgraded'
  | 'contract_signed'
  | 'payment';

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: 'Pendente',
  active: 'Ativa',
  expired: 'Expirada',
  cancelled: 'Cancelada',
  frozen: 'Congelada',
};

export const CANCEL_REASONS = [
  { value: 'mudanca', label: 'Mudança' },
  { value: 'saude', label: 'Saúde' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'insatisfacao', label: 'Insatisfação' },
  { value: 'outro', label: 'Outro' },
] as const;

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
  objective: string | null;
  firstContactAt: string | null;
  goal: string | null;
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
  planType: PlanType | string;
  durationDays: number;
  price: number;
  enrollmentFee: number;
  frequency: string | null;
  allowedDays: number[] | null;
  allowedHours: Record<string, unknown> | null;
  fidelityDays: number;
  graceDays: number;
  discountPercent: number;
  notes: string | null;
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
  trainerId: string | null;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus | string;
  discountPercent: number;
  discountAmount: number;
  paymentMethod: string | null;
  monthlyFee: number | null;
  notes: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  /** enriched list fields */
  studentName?: string | null;
  planName?: string | null;
  daysUntilExpiry?: number | null;
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
  signedName: string | null;
  createdAt: string;
}

export interface EnrollmentFreeze {
  id: string;
  companyId: string;
  enrollmentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  endedAt: string | null;
}

export interface EnrollmentEvent {
  id: string;
  companyId: string;
  enrollmentId: string;
  kind: EnrollmentEventKind | string;
  title: string;
  description: string | null;
  meta: Record<string, unknown> | null;
  createdBy: string | null;
  occurredAt: string;
}

export interface EnrollmentPlanChange {
  id: string;
  companyId: string;
  enrollmentId: string;
  fromPlanId: string;
  toPlanId: string;
  prorationAmount: number;
  creditAmount: number;
  effectiveDate: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface EnrollmentCompleteResult {
  enrollment: Enrollment;
  contract: Contract;
  studentId: string;
}

export interface RenewalDueItem {
  enrollment: Enrollment;
  daysUntilExpiry: number;
  studentName: string;
  planName: string;
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
  ReceivableDisplayStatus,
  PayableStatus,
  PayableCategory,
  SubscriptionStatus,
  SubscriptionRecurrence,
  PaymentGateway,
  PaymentTxStatus,
  CashDirection,
  OutboxStatus,
  CashSessionStatus,
  CashSessionMovementType,
  FinancialHealthLevel,
  FinancialAccount,
  CostCenter,
  PaymentMethod,
  Supplier,
  FinanceSubscription,
  Receivable,
  Payable,
  PaymentTransaction,
  CashSession,
  CashSessionMovement,
  CashSessionReport,
  CashflowSummary,
  CashflowPoint,
  DreReport,
  FinancialHealthScore,
  FinanceDashboard,
  DelinquencyItem,
  DelinquencyReport,
  DueAlertItem,
  OutboxEvent,
} from './finance/helpers';

