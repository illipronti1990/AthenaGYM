import { SetMetadata } from '@nestjs/common';
import { PUBLIC_SCOPES_KEY } from '../guards/public-api.guard';

export const Scopes = (...scopes: string[]) => SetMetadata(PUBLIC_SCOPES_KEY, scopes);
