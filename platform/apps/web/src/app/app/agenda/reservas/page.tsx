import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BookingBoard } from '@/modules/agenda/bookings/BookingBoard';
export default async function ReservasPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Reservas" description="Acompanhe ocupação e fila de espera." /><PageContent><BookingBoard accessToken={token} /></PageContent></Page>; }
