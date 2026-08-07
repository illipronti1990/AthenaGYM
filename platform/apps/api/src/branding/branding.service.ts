import { Injectable, NotFoundException } from '@nestjs/common';
import { MOVVO_PRODUCT, resolveCompanyBranding } from '@movvo/shared';
import { RedisCacheService } from '../cache/redis-cache.service';
import { SupabaseService } from '../supabase/supabase.service';

export type BrandingResponse = {
  name: string;
  shortName: string;
  slogan: string;
  logo: string;
  favicon: string;
  colors: { primary: string; secondary: string };
  domain: string;
  url: string;
  aiName: string;
  version: string;
  buildLabel: string;
  assets: typeof MOVVO_PRODUCT.assets;
  tenant: ReturnType<typeof resolveCompanyBranding> | null;
};

@Injectable()
export class BrandingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly cache: RedisCacheService,
  ) {}

  async getPublic(companyId?: string | null, hostname?: string | null): Promise<BrandingResponse> {
    const cacheKey = this.cache.key(
      companyId || hostname || 'default',
      'branding',
      hostname || companyId || 'root',
    );
    return this.cache.wrap(cacheKey, RedisCacheService.TTL.branding, () =>
      this.loadPublic(companyId, hostname),
    );
  }

  private async loadPublic(
    companyId?: string | null,
    hostname?: string | null,
  ): Promise<BrandingResponse> {
    const product: BrandingResponse = {
      name: MOVVO_PRODUCT.name,
      shortName: MOVVO_PRODUCT.shortName,
      slogan: MOVVO_PRODUCT.slogan,
      logo: MOVVO_PRODUCT.assets.logo,
      favicon: MOVVO_PRODUCT.assets.favicon,
      colors: { ...MOVVO_PRODUCT.colors },
      domain: MOVVO_PRODUCT.domain,
      url: MOVVO_PRODUCT.url,
      aiName: MOVVO_PRODUCT.aiName,
      version: MOVVO_PRODUCT.version,
      buildLabel: MOVVO_PRODUCT.buildLabel,
      assets: MOVVO_PRODUCT.assets,
      tenant: null,
    };

    let resolvedId = companyId?.trim() || null;
    if (!resolvedId && hostname?.trim()) {
      const host = hostname.trim().toLowerCase().split(':')[0];
      const { data: domain } = await this.supabase
        .getAdmin()
        .from('tenant_domains')
        .select('company_id')
        .eq('hostname', host)
        .eq('dns_status', 'verified')
        .is('deleted_at', null)
        .maybeSingle();
      resolvedId = domain?.company_id ? String(domain.company_id) : null;
    }

    if (!resolvedId) return product;

    const { data, error } = await this.supabase
      .getAdmin()
      .from('companies')
      .select(
        'name, logo_url, favicon_url, primary_color, secondary_color, background_login, theme, font_family, email_from',
      )
      .eq('id', resolvedId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new NotFoundException('Company not found');

    product.tenant = resolveCompanyBranding({
      name: data.name as string,
      logoUrl: (data.logo_url as string) || null,
      faviconUrl: (data.favicon_url as string) || null,
      primaryColor: (data.primary_color as string) || null,
      secondaryColor: (data.secondary_color as string) || null,
      backgroundLogin: (data.background_login as string) || null,
      theme: (data.theme as string) || null,
    });

    return product;
  }
}
