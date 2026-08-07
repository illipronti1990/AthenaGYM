import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { AgendaCalendar } from '@/modules/agenda/calendar/AgendaCalendar';
export default async function GradePage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Grade semanal" description="Organize horários e replique uma semana." /><PageContent><AgendaCalendar accessToken={token} /></PageContent></Page>; }
