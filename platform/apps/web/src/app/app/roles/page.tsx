import { redirect } from 'next/navigation';

/** Alias → G-14 cargos admin */
export default function RolesRedirectPage() {
  redirect('/app/admin/cargos');
}
