export type SaasStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type SaasSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'paused';
export type SaasBillingCycle = 'monthly' | 'yearly';
export type SaasInvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type DnsStatus = 'pending' | 'verified' | 'failed';
export type SslStatus = 'pending' | 'provisioning' | 'provisioned' | 'failed';
export type SaasEnvironment = 'development' | 'homologation' | 'production';

export const SAAS_FEATURE_KEYS = [
  'inventory',
  'crm',
  'ai',
  'bi',
  'pdv',
  'marketplace',
  'whiteLabel',
  'mobile',
  'api',
] as const;

export type SaasFeatureKey = (typeof SAAS_FEATURE_KEYS)[number];

export const SAAS_LIMIT_KEYS = ['students', 'users', 'units', 'trainers'] as const;
export type SaasLimitKey = (typeof SAAS_LIMIT_KEYS)[number];

export interface SaasPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  trialDays: number;
  sortOrder: number;
  active: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number | null>;
}

export interface TenantSummary {
  id: string;
  name: string;
  tradeName: string | null;
  legalName: string | null;
  document: string | null;
  status: string;
  saasStatus: SaasStatus;
  planCode: string | null;
  activatedAt: string | null;
  nextDueAt: string | null;
  trialEndsAt: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  theme: string | null;
  fontFamily: string | null;
  emailFrom: string | null;
  emailReplyTo: string | null;
  createdAt: string;
}

export interface TenantDomain {
  id: string;
  companyId: string;
  hostname: string;
  isPrimary: boolean;
  verificationToken: string;
  dnsStatus: DnsStatus;
  sslStatus: SslStatus;
  verifiedAt: string | null;
  sslProvisionedAt: string | null;
}

export interface SaasSubscription {
  id: string;
  companyId: string;
  planId: string;
  planCode?: string;
  status: SaasSubscriptionStatus;
  billingCycle: SaasBillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
}

export interface SaasInvoice {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  number: string;
  status: SaasInvoiceStatus;
  amount: number;
  currency: string;
  dueAt: string | null;
  paidAt: string | null;
}

export interface SaasSupportTicket {
  id: string;
  companyId: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
}

export interface TenantEntitlements {
  companyId: string;
  planCode: string | null;
  flags: Record<string, boolean>;
  limits: Record<string, number | null>;
  usage: Record<string, number>;
}
