import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { PrismaService } from '../prisma/prisma.service'
import { SocketGateway } from '../socket/socket.gateway'
import { getCatalogPrice } from './catalog'

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  getKitchenOrders() {
    return this.prisma.order.findMany({
      where: { status: { in: ['pending', 'cooking', 'ready'] } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  getCashierOrders() {
    return this.prisma.order.findMany({
      where: { status: 'ready', paymentStatus: 'unpaid' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  getHistoryOrders() {
    return this.prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
  }

  async createOrder(body: {
    customerName: string
    tableNumber?: string
    items: { name: string; qty: number; price?: number }[]
  }) {
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item')
    }
    if (body.items.length > 50) {
      throw new BadRequestException('Too many items in one order')
    }

    const validatedItems = body.items.map((item) => {
      const name = typeof item?.name === 'string' ? item.name.trim() : ''
      const qty = Number(item?.qty)
      const price = getCatalogPrice(name)

      if (!name || name.length > 120 || price === undefined) {
        throw new BadRequestException(`Unknown menu item: ${name || '-'}`)
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
        throw new BadRequestException(`Invalid quantity for ${name}`)
      }
      return { name, qty, price }
    })

    const tableNumber = body.tableNumber == null ? null : String(body.tableNumber).trim()
    if (tableNumber && (!/^\d{1,3}$/.test(tableNumber) || Number(tableNumber) < 1)) {
      throw new BadRequestException('Invalid table number')
    }

    const baseCustomerName = typeof body.customerName === 'string'
      ? body.customerName.trim().slice(0, 80)
      : ''
    const customerName = tableNumber
      ? `${baseCustomerName || 'Guest'} (Table ${tableNumber})`
      : baseCustomerName || 'Guest'

    const order = await this.prisma.order.create({
      data: {
        id: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
        customerName,
        tableNumber,
        status: 'pending',
        paymentStatus: 'unpaid',
        total: validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0),
        createdAt: new Date(),
        items: { create: validatedItems },
      },
      include: { items: true },
    })

    this.emitOrdersUpdated()
    return order
  }

  async updateStatus(id: string, status: 'pending' | 'cooking' | 'ready') {
    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) throw new NotFoundException(`Order ${id} not found`)

    const allowedTransitions: Record<string, string[]> = {
      pending: ['cooking'],
      cooking: ['ready'],
      ready: [],
    }
    if (!allowedTransitions[order.status]?.includes(status)) {
      throw new ConflictException(`Cannot change order from ${order.status} to ${status}`)
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    })
    this.emitOrdersUpdated()
    return updated
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) throw new NotFoundException(`Order ${id} not found`)
    if (order.paymentStatus === 'paid') {
      throw new ConflictException('Paid orders cannot be deleted')
    }
    if (order.status !== 'ready') {
      throw new ConflictException(`Order ${id} is not ready to be cleared`)
    }

    const deleted = await this.prisma.order.delete({ where: { id } })
    this.emitOrdersUpdated()
    return deleted
  }

  async updatePayment(
    id: string,
    paymentMethod: 'cash' | 'qris',
    paymentAmount?: number,
  ) {
    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) throw new NotFoundException(`Order ${id} not found`)
    if (order.status !== 'ready') {
      throw new ConflictException('Only ready orders can be paid')
    }
    if (order.paymentStatus === 'paid') {
      throw new ConflictException('Order is already paid')
    }
    if (!['cash', 'qris'].includes(paymentMethod)) {
      throw new BadRequestException('Invalid payment method')
    }

    const amount = paymentMethod === 'qris' ? order.total : Number(paymentAmount)
    if (!Number.isInteger(amount) || amount < order.total) {
      throw new BadRequestException('Payment amount is less than order total')
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'paid',
        paymentMethod,
        paymentAmount: amount,
        changeAmount: amount - order.total,
        paidAt: new Date(),
      },
      include: { items: true },
    })
    this.emitOrdersUpdated()
    return updated
  }

  private emitOrdersUpdated() {
    try {
      this.socketGateway.emitOrdersUpdated()
    } catch (error) {
      console.error('Socket emit failed', error)
    }
  }
}
