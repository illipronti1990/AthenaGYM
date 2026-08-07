import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { AgendaCalendar } from '@/modules/agenda/calendar/AgendaCalendar';
export default async function CalendarioPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Calendário" description="Visualize a agenda por dia, semana, mês ou lista." /><PageContent><AgendaCalendar accessToken={token} /></PageContent></Page>; }
