import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicApiContext } from '@athena/shared';
import { PUBLIC_API_CONTEXT_KEY, RequestPublic } from '../guards/public-api.guard';

export const CurrentPublic = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicApiContext => {
    const req = ctx.switchToHttp().getRequest<RequestPublic>();
    return req[PUBLIC_API_CONTEXT_KEY] as PublicApiContext;
  },
);
