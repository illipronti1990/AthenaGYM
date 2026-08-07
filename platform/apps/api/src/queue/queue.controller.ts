import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/decorators/rbac.decorators';
import { PermissionsGuard } from '../common/guards/rbac.guards';
import { QueueName, QueueService } from './queue.service';

@ApiTags('queue')
@ApiBearerAuth()
@Controller('queue')
export class QueueController {
  constructor(private readonly queues: QueueService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('observability.read', 'platform.manage', 'saas.read')
  stats() {
    return this.queues.counts();
  }

  @Post('enqueue')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('platform.manage', 'observability.read')
  enqueue(
    @Body()
    body: { queue: QueueName; jobName: string; data?: Record<string, unknown> },
  ) {
    return this.queues.enqueue(body.queue, body.jobName, body.data || {});
  }
}
