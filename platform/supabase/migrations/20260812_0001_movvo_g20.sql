-- Movvo G-20 — product theme id migration (tenant names unchanged)
-- Product = Movvo; demo tenant "Athena Academia" must remain as company name.

-- Migrate legacy product theme token on companies
update public.companies
set theme = 'movvo'
where theme = 'athena';

-- Align background_login product tokens (not tenant branding name)
update public.companies
set background_login = replace(background_login, 'athena-', 'movvo-')
where background_login like 'athena-%';

comment on column public.companies.theme is
  'Product UI theme id (movvo). Legacy value athena is migrated; tenant display name is independent (e.g. Athena Academia).';
