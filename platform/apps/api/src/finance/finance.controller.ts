import {
  Body,
  Controller,
  Delete,
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
import type { AuthContext } from '@movvo/shared';
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
  CashSessionAmountDto,
  CloseCashSessionDto,
  CreateAccountDto,
  CreateCostCenterDto,
  UpdateCostCenterDto,
  CreatePayableDto,
  CreatePixDto,
  CreateReceivableDto,
  CreateSubscriptionDto,
  InstallmentsDto,
  OpenCashSessionDto,
  ReceivePaymentDto,
  ReconciliationImportDto,
  RenegotiateDto,
  UpdateAccountDto,
  UpdatePayableDto,
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

  @Get('delinquency')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  delinquency(@CurrentAuth() auth: AuthContext) {
    return this.finance.delinquency(auth);
  }

  @Get('receivables/due-alerts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  dueAlerts(@CurrentAuth() auth: AuthContext, @Query('days') days?: string) {
    return this.finance.dueAlerts(auth, days);
  }

  @Get('receivables')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  listReceivables(
    @CurrentAuth() auth: AuthContext,
    @Query('studentId') studentId?: string,
    @Query('planId') planId?: string,
    @Query('paymentMethodId') paymentMethodId?: string,
    @Query('trainerId') trainerId?: string,
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance.listReceivables(auth, {
      studentId,
      planId,
      paymentMethodId,
      trainerId,
      unitId,
      status,
      from,
      to,
    });
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
    @Body() dto: ReceivePaymentDto,
  ) {
    return this.finance.receiveManual(user, auth, id, dto || {});
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

  @Patch('payables/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  updatePayable(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdatePayableDto,
  ) {
    return this.finance.updatePayable(auth, id, dto);
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

  @Post('payables/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  cancelPayable(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.finance.cancelPayable(user, auth, id);
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

  @Get('cashflow/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reports')
  cashflowSummary(
    @CurrentAuth() auth: AuthContext,
    @Query('range') range?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.finance.cashflowSummary(auth, range, from, to);
  }

  @Get('cashflow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reports')
  cashflow(
    @CurrentAuth() auth: AuthContext,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('range') range?: string,
  ) {
    if (range) return this.finance.cashflowSummary(auth, range, from, to);
    return this.finance.cashflow(auth, from, to);
  }

  @Delete('cashflow/:date')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update')
  @ApiOperation({ summary: 'Remove cash movements for a day' })
  deleteCashflowDay(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('date') date: string,
  ) {
    return this.finance.deleteCashflowDay(user, auth, date);
  }

  @Post('sessions/open')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  openSession(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: OpenCashSessionDto,
  ) {
    return this.finance.openCashSession(user, auth, dto);
  }

  @Get('sessions/current')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.read')
  async currentSession(@CurrentAuth() auth: AuthContext, @Query('unitId') unitId?: string) {
    const session = await this.finance.currentCashSession(auth, unitId);
    // Nest serializes bare `null` as an empty body — wrap to keep valid JSON for the web client
    return { session };
  }

  @Post('sessions/:id/sangria')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  async sangria(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CashSessionAmountDto,
  ) {
    const result = await this.finance.sangriaCashSession(user, auth, id, dto);
    return result.session;
  }

  @Post('sessions/:id/supply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  async supply(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CashSessionAmountDto,
  ) {
    const result = await this.finance.supplyCashSession(user, auth, id, dto);
    return result.session;
  }

  @Post('sessions/:id/close')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.pay')
  closeSession(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CloseCashSessionDto,
  ) {
    return this.finance.closeCashSession(user, auth, id, dto);
  }

  @Get('sessions/:id/report')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.reports')
  sessionReport(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.finance.cashSessionReport(auth, id);
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

  @Patch('cost-centers/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update', 'admin.write')
  updateCostCenter(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateCostCenterDto,
  ) {
    return this.finance.updateCostCenter(auth, id, dto);
  }

  @Delete('cost-centers/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
  @Permissions('finance.update', 'admin.write')
  deleteCostCenter(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.finance.softDeleteCostCenter(auth, id);
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
