import { redirect } from 'next/navigation';

export default function SecurityMfaRedirect() {
  redirect('/app/security/sessions');
}
