import Link from 'next/link';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { AGENDA_LINKS } from '@/modules/agenda/utils/agendaLinks';
import { AgendaDashboard } from '@/modules/agenda/coach/AgendaDashboard';

export default async function AgendaHubPage() {
  const token = await requireAccessToken();
  return <Page {...pageQualityAttrs()}><PageHeader title="Agenda" description="Aulas, reservas, salas, presença e agenda dos professores." /><PageFilters>{AGENDA_LINKS.slice(1).map(([label, href]) => <Link key={href} href={href} className="movvo-chip-nav">{label}</Link>)}</PageFilters><PageContent><AgendaDashboard accessToken={token} /></PageContent></Page>;
}
