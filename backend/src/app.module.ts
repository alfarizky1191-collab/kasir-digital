import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { OrderModule } from './order/order.module'
import { PrismaModule } from './prisma/prisma.module'
import { SocketModule } from './socket/socket.module'
import { ShiftModule } from './shift/shift.module'
import { AuditModule } from './audit/audit.module'
import { AuthModule } from './auth/auth.module'
import { AuthGuard } from './auth/auth.guard'
import { RolesGuard } from './auth/roles.guard'
import { ProductModule } from './product/product.module'
import { UserModule } from './user/user.module'
import { ReportModule } from './report/report.module'

@Module({
  imports: [
    PrismaModule,
    SocketModule,
    OrderModule,
    ShiftModule,
    AuditModule,
    AuthModule,
    ProductModule,
    UserModule,
    ReportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
