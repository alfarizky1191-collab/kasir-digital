import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'

import { OrderService } from './order.service'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { SessionUser } from '../auth/auth.types'

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Roles('owner', 'admin', 'kitchen')
  @Get('kitchen')
  getKitchenOrders() { return this.orders.getKitchenOrders() }

  @Roles('owner', 'admin', 'cashier')
  @Get('cashier')
  getCashierOrders() { return this.orders.getCashierOrders() }

  @Roles('owner', 'admin', 'cashier')
  @Get('history')
  getHistoryOrders() { return this.orders.getHistoryOrders() }

  @Public()
  @Get(':id/status')
  async getPublicStatus(@Param('id') id: string) {
    const order = await this.orders.getById(id)
    return order ? { id: order.id, status: order.status } : null
  }

  @Roles('owner', 'admin', 'cashier')
  @Get(':id')
  getById(@Param('id') id: string) { return this.orders.getById(id) }

  @Public()
  @Post()
  createOrder(@Body() body: {
    customerName?: string
    tableNumber?: string
    items: { productId?: string; name?: string; qty: number }[]
  }) {
    return this.orders.createOrder(body)
  }

  @Roles('owner', 'admin', 'kitchen')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'cooking' | 'ready',
    @CurrentUser() user: SessionUser,
  ) {
    return this.orders.updateStatus(id, status, user)
  }

  @Roles('owner', 'admin', 'cashier')
  @Patch(':id/payment')
  updatePayment(
    @Param('id') id: string,
    @Body() body: { paymentMethod: 'cash' | 'qris'; paymentAmount?: number },
    @CurrentUser() user: SessionUser,
  ) {
    return this.orders.updatePayment(id, body.paymentMethod, body.paymentAmount, user)
  }

  @Roles('owner', 'admin', 'cashier')
  @Post(':id/void')
  voidOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.orders.voidOrder(id, reason, user)
  }

  @Roles('owner', 'admin')
  @Post(':id/refund')
  refund(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.orders.refund(id, reason, user)
  }
}
