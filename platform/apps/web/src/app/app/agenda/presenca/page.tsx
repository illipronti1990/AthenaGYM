import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { AttendanceRoll } from '@/modules/agenda/attendance/AttendanceRoll';
export default async function PresencaPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Presença" description="Faça a chamada e conclua as aulas." /><PageContent><AttendanceRoll accessToken={token} /></PageContent></Page>; }
