import { redirect } from 'next/navigation';

/** Movvo AI vive no botão flutuante do AppShell (portal incluso). */
export default function PortalAssistenteRedirect() {
  redirect('/app/portal');
}
