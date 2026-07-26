import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthContext } from '@athena/shared';
import {
  AUTH_CONTEXT_KEY,
  AUTH_USER_KEY,
  AuthUser,
  RequestAuth,
} from '../../auth/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<RequestAuth>();
    return req[AUTH_USER_KEY] as AuthUser;
  },
);

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest<RequestAuth>();
    return req[AUTH_CONTEXT_KEY] as AuthContext;
  },
);

export const CurrentCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<RequestAuth>();
    const header = req.headers['x-company-id'];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    const auth = req[AUTH_CONTEXT_KEY];
    return (fromHeader as string) || auth?.companyId || null;
  },
);

export const CurrentUnit = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest<RequestAuth>();
    const header = req.headers['x-unit-id'];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    const auth = req[AUTH_CONTEXT_KEY];
    return (fromHeader as string) || auth?.defaultUnitId || null;
  },
);
