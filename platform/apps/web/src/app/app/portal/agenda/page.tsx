import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { StudentAgenda } from '@/modules/agenda/portal/StudentAgenda';
export default async function StudentAgendaPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Minha agenda" description="Reserve e acompanhe suas aulas." /><PageContent><StudentAgenda accessToken={token} /></PageContent></Page>; }
