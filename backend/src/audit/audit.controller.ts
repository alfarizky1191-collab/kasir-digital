import { Controller, Get } from '@nestjs/common'

import { AuditService } from './audit.service'
import { Roles } from '../auth/roles.decorator'

@Roles('owner', 'admin')
@Controller('api/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getLogs() {
    return this.auditService.getLogs()
  }
}
