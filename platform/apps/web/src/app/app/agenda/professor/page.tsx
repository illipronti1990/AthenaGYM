import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { TeacherAgenda } from '@/modules/agenda/coach/TeacherAgenda';
export default async function ProfessorAgendaPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Agenda do professor" description="Seus horários, aulas e compromissos." /><PageContent><TeacherAgenda accessToken={token} /></PageContent></Page>; }
