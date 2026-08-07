import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { RoomForm } from '@/modules/agenda/rooms/RoomForm';
export default async function SalasPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Salas" description="Capacidade, área, status e equipamentos." /><PageContent><RoomForm accessToken={token} /></PageContent></Page>; }
