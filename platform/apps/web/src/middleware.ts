import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

const DEV_TOKEN_COOKIE = 'athena_dev_token';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const path = request.nextUrl.pathname;
  const isApp = path.startsWith('/app');
  const isAuthPage = path === '/login' || path === '/forgot-password';
  const devAuth = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
  const devToken = request.cookies.get(DEV_TOKEN_COOKIE)?.value;

  if (devAuth && devToken) {
    if (isAuthPage) {
      const app = request.nextUrl.clone();
      app.pathname = '/app';
      return NextResponse.redirect(app);
    }
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !anonKey) {
    if (isApp) {
      if (devAuth && !devToken) {
        const login = request.nextUrl.clone();
        login.pathname = '/login';
        return NextResponse.redirect(login);
      }
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      return NextResponse.redirect(login);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isApp && !user) {
    const login = request.nextUrl.clone();
    login.pathname = '/login';
    return NextResponse.redirect(login);
  }

  if (isAuthPage && user) {
    const app = request.nextUrl.clone();
    app.pathname = '/app';
    return NextResponse.redirect(app);
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/login', '/forgot-password'],
};
