// backend/src/order/order.controller.ts

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { OrderService } from './order.service';

@Controller('api/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Get('kitchen')
  getKitchenOrders() {
    return this.orderService.getKitchenOrders();
  }

  @Get('cashier')
  getCashierOrders() {
    return this.orderService.getCashierOrders();
  }

  @Get('history')
  getHistoryOrders() {
    return this.orderService.getHistoryOrders();
  }

  @Post()
  async createOrder(
    @Body()
    body: {
      customerName: string;
      tableNumber?: string;

      items: {
        name: string;
        qty: number;
        price: number;
      }[];
    },
  ) {
    try {
      return await this.orderService.createOrder(body)
    } catch (err) {
      console.error('CREATE ORDER ERROR payload:', body)
      console.error('CREATE ORDER ERROR stack:', (err as any) && (err as any).stack ? (err as any).stack : err)

      const message = (err as any)?.message || String(err) || 'Create order failed'

      throw new HttpException({ success: false, message }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,

    @Body('status')
    status:
      | 'pending'
      | 'cooking'
      | 'ready',
  ) {
    if (
      ![
        'pending',
        'cooking',
        'ready',
      ].includes(status)
    ) {
      throw new NotFoundException(
        'Invalid status',
      );
    }

    return this.orderService.updateStatus(
      id,
      status,
    );
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    try {
      return await this.orderService.deleteOrder(id)
    } catch (err) {
      // If service threw NotFoundException, rethrow to preserve 404
      if (err instanceof NotFoundException) throw err

      const message = (err as any)?.message || String(err) || 'Delete order failed'

      throw new HttpException({ success: false, message }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  @Patch(':id/payment')
  async updatePayment(
    @Param('id') id: string,

    @Body('paymentMethod') paymentMethod: 'cash' | 'qris',

    @Body('paymentAmount') paymentAmount?: number,
  ) {
    const payload = { id, paymentMethod, paymentAmount }

    try {
      return await this.orderService.updatePayment(
        id,
        paymentMethod,
        paymentAmount,
      )
    } catch (err) {
      // Log request payload and full error/stack for debugging
      console.error('PAYMENT HANDLER ERROR payload:', payload)
      console.error('PAYMENT HANDLER ERROR stack:', (err as any) && (err as any).stack ? (err as any).stack : err)

      // If service threw NotFoundException, rethrow to preserve 404
      if (err instanceof NotFoundException) throw err

      // If error is a plain string or object, include it in response
      const message = (err as any)?.message || String(err) || 'Payment handler failed'

      throw new HttpException(
        { success: false, message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}