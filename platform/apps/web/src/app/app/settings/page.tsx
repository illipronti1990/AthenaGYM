import { requireAccessToken } from '@/lib/auth/token';
import { SettingsHub } from '@/modules/settings/components/SettingsHub';

export default async function SettingsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="text-sm text-zinc-600">Academia, financeiro, backup, logs e acessos</p>
      <SettingsHub accessToken={accessToken} />
    </div>
  );
}
