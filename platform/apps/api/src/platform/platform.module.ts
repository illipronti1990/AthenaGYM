import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PlatformEventListeners } from './events/platform-listeners';
import { PublicApiGuard, ScopesGuard } from './guards/public-api.guard';
import { OauthController } from './oauth.controller';
import { MarketplaceController, PlatformController } from './platform.controller';
import { PlatformFeaturesController } from './platform-features.controller';
import { PlatformRepository } from './platform.repository';
import { PlatformService } from './platform.service';
import { PublicApiController } from './public-api.controller';
import {
  PlatformEntitlementsPublicController,
  TenantsController,
} from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule, AuditModule, EventEmitterModule.forRoot()],
  controllers: [
    OauthController,
    PublicApiController,
    PlatformController,
    PlatformFeaturesController,
    MarketplaceController,
    TenantsController,
    PlatformEntitlementsPublicController,
  ],
  providers: [
    PlatformRepository,
    PlatformService,
    PlatformEventListeners,
    PublicApiGuard,
    ScopesGuard,
    TenantsService,
  ],
  exports: [PlatformService, TenantsService],
})
export class PlatformModule {}
