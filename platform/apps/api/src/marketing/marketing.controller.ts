import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/decorators/rbac.decorators';
import { RolesGuard } from '../common/guards/rbac.guards';
import { CreateDemoRequestDto, UpdateDemoRequestDto } from './dto/demo-request.dto';
import { MarketingService } from './marketing.service';

@ApiTags('marketing')
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  @Post('demo-requests')
  @ApiOperation({ summary: 'Public commercial demo request (no auth)' })
  async createDemoRequest(
    @Body() dto: CreateDemoRequestDto,
    @Headers('x-forwarded-for') forwarded?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const ip = (forwarded || '').split(',')[0]?.trim() || undefined;
    try {
      return await this.marketing.createDemoRequest(dto, { ip, userAgent });
    } catch (e) {
      this.rethrow(e);
    }
  }

  @Get('demo-requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'List commercial leads (platform)' })
  list(@Query('status') status?: string) {
    return this.marketing.listDemoRequests({ status });
  }

  @Get('demo-requests/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  getOne(@Param('id') id: string) {
    return this.marketing.getDemoRequest(id).catch((e) => this.rethrow(e));
  }

  @Patch('demo-requests/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateDemoRequestDto) {
    return this.marketing.updateDemoRequest(id, dto).catch((e) => this.rethrow(e));
  }

  @Get('analytics/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  analytics() {
    return this.marketing.analyticsSummary();
  }

  @Get('onboarding')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  listOnboarding() {
    return this.marketing.listOnboarding();
  }

  @Post('onboarding')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  upsertOnboarding(@Body() body: Record<string, unknown>) {
    return this.marketing.upsertOnboarding({
      id: body.id as string | undefined,
      leadId: body.leadId as string | undefined,
      academyName: body.academyName as string | undefined,
      stage: body.stage as string | undefined,
      checklist: body.checklist as Record<string, boolean> | undefined,
      notes: body.notes as string | undefined,
    });
  }

  @Get('materials/one-pager.pdf')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Commercial one-pager PDF' })
  async onePagerPdf() {
    return this.marketing.onePagerPdf();
  }

  private rethrow(e: unknown): never {
    const err = e as Error & { status?: number };
    if (err.status === 429) throw new HttpException(err.message, HttpStatus.TOO_MANY_REQUESTS);
    if (err.status === 400) throw new BadRequestException(err.message);
    if (err.status === 404) throw new NotFoundException(err.message);
    throw new HttpException(err.message || 'Failed', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
