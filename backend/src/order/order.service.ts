import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async getKitchenOrders() {
    // include 'ready' so DONE orders are visible in kitchen KDS
    return this.prisma.order.findMany({
      where: {
        OR: [
          { status: 'pending' },
          { status: 'cooking' },
          { status: 'ready' },
        ],
      },

      include: {
        items: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCashierOrders() {
    return this.prisma.order.findMany({
      where: {
        status: 'ready',
        paymentStatus: 'unpaid',
      },

      include: {
        items: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getHistoryOrders() {
    return this.prisma.order.findMany({
      where: {
        paymentStatus: 'paid',
      },

      include: {
        items: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createOrder(body: {
    customerName: string;

    items: {
      name: string;
      qty: number;
      price: number;
    }[];

    tableNumber?: string;
  }) {
    // Generate incremental order id ORD-0001, ORD-0002 ...
    const last = await this.prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let nextNum = 1

    if (last && last.id) {
      const m = last.id.match(/ORD-(\d+)/)

      if (m) {
        nextNum = parseInt(m[1], 10) + 1
      }
    }

    const orderId = `ORD-${String(nextNum).padStart(4, '0')}`

    // If tableNumber provided, append to customerName for minimal schema-safe storage
    const customerName = body.tableNumber
      ? `${body.customerName || 'Guest'} (Table ${body.tableNumber})`
      : body.customerName || 'Guest'

    try {
      const order = await this.prisma.order.create({
        data: {
          id: orderId,

          customerName,
          tableNumber: body.tableNumber || null,

          status: 'pending',

          paymentStatus: 'unpaid',

          total: body.items.reduce((acc, item) => acc + item.price * item.qty, 0),

          createdAt: new Date(),

          items: {
            create: body.items.map((item) => ({
              name: item.name,
              qty: item.qty,
              price: item.price,
            })),
          },
        },

        include: {
          items: true,
        },
      })

      try {
        this.socketGateway.emitOrdersUpdated()
      } catch (emitErr) {
        console.error('Socket emit error after createOrder:', emitErr)
      }

      return order
    } catch (err) {
      console.error('Prisma create error in createOrder:', err)
      console.error('createOrder payload:', body)
      throw err
    }
  }

  async updateStatus(
    id: string,
    status:
      | 'pending'
      | 'cooking'
      | 'ready',
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: { id },
      });

    if (!order) {
      throw new NotFoundException(
        `Order ${id} not found`,
      );
    }

    const updated =
      await this.prisma.order.update({
        where: { id },

        data: {
          status,
        },

        include: {
          items: true,
        },
      });

    this.socketGateway.emitOrdersUpdated();

    return updated;
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } })

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`)
    }

    // Only allow deleting orders that are already marked ready
    if (order.status !== 'ready') {
      throw new NotFoundException(`Order ${id} is not ready to be cleared`)
    }

    const deleted = await this.prisma.order.delete({ where: { id } })

    try {
      this.socketGateway.emitOrdersUpdated()
    } catch (err) {
      console.error('Socket emit error after deleteOrder:', err)
    }

    return deleted
  }

  async updatePayment(
    id: string,
    paymentMethod: 'cash' | 'qris',
    paymentAmount?: number,
  ) {
    let order: any = null

    try {
      order = await this.prisma.order.findUnique({ where: { id } })
    } catch (err) {
      console.error('Prisma findUnique error in updatePayment:', err)
      console.error('Request id:', id)
      throw err
    }

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`)
    }

    const dataUpdate: any = {
      paymentStatus: 'paid',
      paymentMethod,
    }

    if (typeof paymentAmount === 'number') {
      dataUpdate.paymentAmount = paymentAmount

      const change = paymentAmount - order.total
      dataUpdate.changeAmount = change
    }

    let updated: any = null

    try {
      updated = await this.prisma.order.update({
        where: { id },
        data: dataUpdate,
        include: { items: true },
      })
    } catch (err) {
      console.error('Prisma update error in updatePayment:', err)
      console.error('update payload:', { id, dataUpdate })
      throw err
    }

    try {
      this.socketGateway.emitOrdersUpdated()
    } catch (err) {
      console.error('Socket emit error after payment update:', err)
    }

    return updated
  }
}