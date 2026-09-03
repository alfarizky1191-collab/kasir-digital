import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async summary(fromInput?: string, toInput?: string) {
    const now = new Date()
    const from = fromInput ? new Date(fromInput) : new Date(now.getFullYear(), now.getMonth(), 1)
    const to = toInput ? new Date(toInput) : now
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
      throw new BadRequestException('Rentang tanggal tidak valid')
    }
    to.setHours(23, 59, 59, 999)

    const orders = await this.prisma.order.findMany({
      where: { paidAt: { gte: from, lte: to }, paymentStatus: { in: ['paid', 'refunded'] } },
      include: { items: true },
      orderBy: { paidAt: 'asc' },
    })

    const valid = orders.filter((order) => order.paymentStatus === 'paid')
    const revenue = valid.reduce((sum, order) => sum + order.total, 0)
    const refundTotal = orders
      .filter((order) => order.paymentStatus === 'refunded')
      .reduce((sum, order) => sum + order.total, 0)
    const products = new Map<string, { name: string; qty: number; revenue: number }>()
    const daily = new Map<string, { date: string; orders: number; revenue: number }>()

    for (const order of valid) {
      const date = (order.paidAt || order.createdAt).toISOString().slice(0, 10)
      const day = daily.get(date) || { date, orders: 0, revenue: 0 }
      day.orders += 1
      day.revenue += order.total
      daily.set(date, day)

      for (const item of order.items) {
        const current = products.get(item.name) || { name: item.name, qty: 0, revenue: 0 }
        current.qty += item.qty
        current.revenue += item.qty * item.price
        products.set(item.name, current)
      }
    }

    return {
      period: { from, to },
      orders: valid.length,
      revenue,
      refundTotal,
      averageOrder: valid.length ? Math.round(revenue / valid.length) : 0,
      cashRevenue: valid.filter((order) => order.paymentMethod === 'cash').reduce((sum, order) => sum + order.total, 0),
      qrisRevenue: valid.filter((order) => order.paymentMethod === 'qris').reduce((sum, order) => sum + order.total, 0),
      topProducts: [...products.values()].sort((a, b) => b.qty - a.qty).slice(0, 10),
      daily: [...daily.values()],
    }
  }
}
