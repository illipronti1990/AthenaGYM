import type { AuthContext } from '@movvo/shared';

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
};

export const AUTH_USER_KEY = 'authUser';
export const AUTH_CONTEXT_KEY = 'authContext';
export const AUTH_TOKEN_KEY = 'authToken';

export type RequestAuth = {
  [AUTH_USER_KEY]?: AuthUser;
  [AUTH_CONTEXT_KEY]?: AuthContext;
  [AUTH_TOKEN_KEY]?: string;
  headers: Record<string, string | string[] | undefined>;
};
