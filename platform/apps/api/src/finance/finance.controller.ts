import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import type { Request } from 'express';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateAccountDto,
  CreateCostCenterDto,
  CreatePayableDto,
  CreatePixDto,
  CreateReceivableDto,
  CreateSubscriptionDto,
  InstallmentsDto,
  ReconciliationImportDto,
  RenegotiateDto,
  UpdateAccountDto,
  UpdateReceivableDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Payment gateway webhook (HMAC + idempotent)' })
  webhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request & { rawBody?: Buffer },
    @Body() body: unknown,
  ) {
    const raw =
      req.rawBody?.toString('utf8') ||
      (typeof body === 'string' ? body : JSON.stringify(body ?? {}));
    return this.finance.handleWebhook(provider, headers, raw);
  }

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.finance.dashboard(auth);
  }

  @Get('receivables')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  listReceivables(
    @CurrentAuth() auth: AuthContext,
    @Query('studentId') studentId?: string,
  ) {
    return this.finance.listReceivables(auth, studentId);
  }

  @Post('receivables')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  createReceivable(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateReceivableDto,
  ) {
    return this.finance.createReceivable(user, auth, dto);
  }

  @Patch('receivables/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  updateReceivable(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateReceivableDto,
  ) {
    return this.finance.updateReceivable(auth, id, dto);
  }

  @Post('receivables/:id/receive')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  receive(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.finance.receiveManual(user, auth, id);
  }

  @Post('receivables/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  cancel(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.finance.cancelReceivable(user, auth, id);
  }

  @Post('receivables/:id/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.refund')
  refund(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.finance.refundReceivable(user, auth, id);
  }

  @Post('receivables/:id/renegotiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  renegotiate(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: RenegotiateDto,
  ) {
    return this.finance.renegotiate(user, auth, id, dto);
  }

  @Post('receivables/:id/installments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  installments(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: InstallmentsDto,
  ) {
    return this.finance.installments(user, auth, id, dto);
  }

  @Get('payables')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  listPayables(@CurrentAuth() auth: AuthContext) {
    return this.finance.listPayables(auth);
  }

  @Post('payables')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  createPayable(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePayableDto,
  ) {
    return this.finance.createPayable(user, auth, dto);
  }

  @Post('payables/:id/pay')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  payPayable(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.finance.payPayable(user, auth, id);
  }

  @Get('subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  listSubscriptions(
    @CurrentAuth() auth: AuthContext,
    @Query('studentId') studentId?: string,
  ) {
    return this.finance.listSubscriptions(auth, studentId);
  }

  @Post('subscriptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  createSubscription(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.finance.createSubscription(user, auth, dto);
  }

  @Post('pix')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  createPix(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePixDto,
  ) {
    return this.finance.createPix(user, auth, dto);
  }

  @Get('cashflow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reports')
  cashflow(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance.cashflow(auth, from, to);
  }

  @Get('dre')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reports')
  dre(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance.dre(auth, from, to);
  }

  @Get('accounts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  accounts(@CurrentAuth() auth: AuthContext) {
    return this.finance.listAccounts(auth);
  }

  @Post('accounts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  createAccount(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateAccountDto,
  ) {
    return this.finance.createAccount(user, auth, dto);
  }

  @Patch('accounts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  updateAccount(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.finance.updateAccount(user, auth, id, dto);
  }

  @Get('cost-centers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  costCenters(@CurrentAuth() auth: AuthContext) {
    return this.finance.listCostCenters(auth);
  }

  @Post('cost-centers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  createCostCenter(@CurrentAuth() auth: AuthContext, @Body() dto: CreateCostCenterDto) {
    return this.finance.createCostCenter(auth, dto);
  }

  @Get('payment-methods')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  methods() {
    return this.finance.listMethods();
  }

  @Post('reconciliation/import')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reconcile')
  importReconciliation(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: ReconciliationImportDto,
  ) {
    return this.finance.importReconciliation(user, auth, dto);
  }

  @Post('reconciliation/match')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reconcile')
  match(@CurrentAuth() auth: AuthContext) {
    const companyId = auth.companyId || auth.companyIds[0];
    return this.finance.autoMatch(companyId!);
  }

  @Post('subscriptions/renew-due')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.create')
  renewDue() {
    return this.finance.renewDueSubscriptions();
  }
}
