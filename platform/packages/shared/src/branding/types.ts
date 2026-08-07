/** Visual identity for a company (tenant). Product is Movvo ERP. */
export interface CompanyBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundLogin: string | null;
  theme: string | null;
}

export type ResolvedCompanyBranding = {
  displayName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundLogin: string;
  theme: string;
  slogan: string;
};
