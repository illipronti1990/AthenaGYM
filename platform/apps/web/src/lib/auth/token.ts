import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DEV_TOKEN_COOKIE } from '@/lib/auth/constants';

export { DEV_TOKEN_COOKIE };

/** Access token for API calls: DEV cookie (Nest JWT) or Supabase Auth session. */
export async function getAccessToken(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_DEV_AUTH === 'true') {
    const jar = await cookies();
    const dev = jar.get(DEV_TOKEN_COOKIE)?.value;
    if (dev) return decodeURIComponent(dev);
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return token;
}
