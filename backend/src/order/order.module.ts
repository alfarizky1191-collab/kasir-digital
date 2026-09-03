import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { SocketModule } from '../socket/socket.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SocketModule, AuditModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
