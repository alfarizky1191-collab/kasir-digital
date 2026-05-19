import { Module } from '@nestjs/common'

import { OrderModule } from './order/order.module'
import { PrismaModule } from './prisma/prisma.module'
import { SocketModule } from './socket/socket.module'
import { ShiftModule } from './shift/shift.module'
import { AuditModule } from './audit/audit.module'

@Module({
  imports: [
    PrismaModule,
    SocketModule,
    OrderModule,
    ShiftModule,
    AuditModule,
  ],
})
export class AppModule {}