-- Multi-tenant visual identity (white-label ready). Athena Academia = first client defaults.

alter table public.companies
  add column if not exists logo_url text null,
  add column if not exists favicon_url text null,
  add column if not exists primary_color varchar(16) null,
  add column if not exists secondary_color varchar(16) null,
  add column if not exists background_login text null,
  add column if not exists theme varchar(20) null default 'athena';

comment on column public.companies.logo_url is 'Company brand logo URL (SVG/PNG)';
comment on column public.companies.favicon_url is 'Company favicon URL';
comment on column public.companies.primary_color is 'Primary brand color (e.g. #B10018)';
comment on column public.companies.secondary_color is 'Secondary/accent color (e.g. #D4AF37)';
comment on column public.companies.background_login is 'Login panel style: athena-red | solid hex | image url';
comment on column public.companies.theme is 'Theme preset key: athena | custom | ...';

-- First client / demo: Athena Academia
update public.companies
set
  name = 'Athena Academia',
  legal_name = coalesce(legal_name, 'ATHENA ACADEMIA LTDA'),
  logo_url = coalesce(logo_url, '/brand/logo-gold.svg'),
  favicon_url = coalesce(favicon_url, '/brand/favicon.svg'),
  primary_color = coalesce(primary_color, '#B10018'),
  secondary_color = coalesce(secondary_color, '#D4AF37'),
  background_login = coalesce(background_login, 'athena-red'),
  theme = coalesce(theme, 'athena'),
  updated_at = now()
where id = '11111111-1111-1111-1111-111111111111';
