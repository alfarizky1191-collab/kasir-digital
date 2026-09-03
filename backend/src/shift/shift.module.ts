import { Module } from '@nestjs/common'

import { ShiftController } from './shift.controller'
import { ShiftService } from './shift.service'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [AuditModule],
  controllers: [ShiftController],
  providers: [ShiftService],
})
export class ShiftModule {}
