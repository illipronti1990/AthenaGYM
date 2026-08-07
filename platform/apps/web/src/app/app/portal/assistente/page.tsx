import { redirect } from 'next/navigation';

/** Athena AI vive no botão flutuante do AppShell (portal incluso). */
export default function PortalAssistenteRedirect() {
  redirect('/app/portal');
}
