import type {
  GymBusinessHours,
  GymSettings,
  GymSettingsFinancialAccountSummary,
} from '@movvo/shared';

type GymSettingsRow = {
  id: string;
  company_id: string;
  name: string;
  cnpj: string | null;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  primary_color: string;
  secondary_color: string;
  receipt_footer: string | null;
  business_hours: GymBusinessHours | null;
  interest_rate: number | string;
  fine_rate: number | string;
  max_discount_pct: number | string;
  grace_days: number;
  created_at: string;
  updated_at: string;
};

export function mapGymSettings(row: GymSettingsRow): GymSettings {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    cnpj: row.cnpj,
    logoUrl: row.logo_url,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    instagram: row.instagram,
    zipCode: row.zip_code,
    street: row.street,
    number: row.number,
    district: row.district,
    city: row.city,
    state: row.state,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    receiptFooter: row.receipt_footer,
    businessHours: row.business_hours || {},
    interestRate: Number(row.interest_rate) || 0,
    fineRate: Number(row.fine_rate) || 0,
    maxDiscountPct: Number(row.max_discount_pct) || 0,
    graceDays: Number(row.grace_days) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAccountSummary(row: {
  id: string;
  bank_name: string;
  pix_key: string | null;
  status: string;
}): GymSettingsFinancialAccountSummary {
  return {
    id: row.id,
    name: row.bank_name,
    bankName: row.bank_name,
    pixKey: row.pix_key,
    active: row.status === 'active',
  };
}
