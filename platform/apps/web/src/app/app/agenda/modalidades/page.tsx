import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { ModalityForm } from '@/modules/agenda/modalities/ModalityForm';
export default async function ModalidadesPage() { const token = await requireAccessToken(); return <Page {...pageQualityAttrs()}><PageHeader title="Modalidades" description="Configure nomes, cores e capacidades padrão." /><PageContent><ModalityForm accessToken={token} /></PageContent></Page>; }
