import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common'

import { AuditService } from './audit.service'

@Controller('api/audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
  ) {}

  @Get()
  getLogs() {
    return this.auditService.getLogs()
  }

  @Post()
  createLog(
    @Body()
    body: {
      action: string
      reason?: string
      orderId?: string
      cashierName: string
    },
  ) {
    return this.auditService.createLog(
      body,
    )
  }
}