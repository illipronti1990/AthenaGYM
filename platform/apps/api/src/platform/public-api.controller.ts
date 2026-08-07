import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PublicApiContext } from '@movvo/shared';
import { CurrentPublic } from './decorators/current-public.decorator';
import { Scopes } from './decorators/scopes.decorator';
import { CreateCheckinPublicDto, CreateWebhookDto } from './dto/platform.dto';
import { PublicApiGuard, ScopesGuard } from './guards/public-api.guard';
import { PlatformService } from './platform.service';

@ApiTags('public-api')
@ApiBearerAuth()
@UseGuards(PublicApiGuard, ScopesGuard)
@Controller('public')
export class PublicApiController {
  constructor(private readonly platform: PlatformService) {}

  private async tracked<T>(
    ctx: PublicApiContext,
    endpoint: string,
    method: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const started = Date.now();
    try {
      const result = await fn();
      await this.platform.logUsage(ctx, endpoint, method, 200, Date.now() - started);
      return result;
    } catch (e) {
      const status = (e as { getStatus?: () => number }).getStatus?.() || 500;
      await this.platform.logUsage(ctx, endpoint, method, status, Date.now() - started, (e as Error).name);
      throw e;
    }
  }

  @Get('alunos')
  @Scopes('students.read')
  @ApiOperation({ summary: 'Public API — list alunos' })
  alunos(
    @CurrentPublic() ctx: PublicApiContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tracked(ctx, '/public/alunos', 'GET', () =>
      this.platform.publicStudents(ctx, Number(page || 1), Number(pageSize || 20)),
    );
  }

  /** @deprecated use GET /public/alunos */
  @Get('students')
  @Scopes('students.read')
  @ApiOperation({ summary: 'Public API — list students (legacy)' })
  students(
    @CurrentPublic() ctx: PublicApiContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tracked(ctx, '/public/students', 'GET', () =>
      this.platform.publicStudents(ctx, Number(page || 1), Number(pageSize || 20)),
    );
  }

  @Get('plans')
  @Scopes('finance.read')
  plans(@CurrentPublic() ctx: PublicApiContext) {
    return this.tracked(ctx, '/public/plans', 'GET', () => this.platform.publicPlans(ctx));
  }

  @Get('units')
  @Scopes('students.read')
  units(@CurrentPublic() ctx: PublicApiContext) {
    return this.tracked(ctx, '/public/units', 'GET', () => this.platform.publicUnits(ctx));
  }

  @Get('workouts')
  @Scopes('workouts.read')
  workouts(@CurrentPublic() ctx: PublicApiContext, @Query('page') page?: string) {
    return this.tracked(ctx, '/public/workouts', 'GET', () =>
      this.platform.publicWorkouts(ctx, Number(page || 1), 20),
    );
  }

  @Get('payments')
  @Scopes('finance.read')
  payments(@CurrentPublic() ctx: PublicApiContext, @Query('page') page?: string) {
    return this.tracked(ctx, '/public/payments', 'GET', () =>
      this.platform.publicPayments(ctx, Number(page || 1), 20),
    );
  }

  @Post('checkins')
  @Scopes('checkins.create')
  checkins(@CurrentPublic() ctx: PublicApiContext, @Body() dto: CreateCheckinPublicDto) {
    return this.tracked(ctx, '/public/checkins', 'POST', () => this.platform.publicCheckin(ctx, dto));
  }

  @Post('webhooks')
  @Scopes('webhooks.manage')
  createWebhook(@CurrentPublic() ctx: PublicApiContext, @Body() dto: CreateWebhookDto) {
    return this.tracked(ctx, '/public/webhooks', 'POST', () =>
      this.platform.createWebhook(ctx, dto, ctx.apiClientDbId),
    );
  }
}
