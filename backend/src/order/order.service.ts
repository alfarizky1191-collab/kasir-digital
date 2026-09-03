import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import type { SessionUser } from '../auth/auth.types'

type IncomingItem = { productId?: string; name?: string; qty: number }

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  getKitchenOrders() {
    return this.prisma.order.findMany({
      where: {
        status: { in: ['pending', 'cooking', 'ready'] },
        paymentStatus: 'unpaid',
      },
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
      where: { paymentStatus: { in: ['paid', 'refunded'] } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
  }

  getById(id: string) {
    return this.prisma.order.findUnique({ where: { id }, include: { items: true } })
  }

  async createOrder(body: { customerName?: string; tableNumber?: string; items: IncomingItem[] }) {
    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      throw new BadRequestException('Pesanan minimal berisi satu produk')
    }
    if (body.items.length > 50) throw new BadRequestException('Produk terlalu banyak')

    const tableNumber = body.tableNumber == null ? null : String(body.tableNumber).trim()
    if (tableNumber && (!/^\d{1,3}$/.test(tableNumber) || Number(tableNumber) < 1)) {
      throw new BadRequestException('Nomor meja tidak valid')
    }
    const baseName = typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 80) : ''
    const customerName = tableNumber
      ? `${baseName || 'Guest'} (Table ${tableNumber})`
      : baseName || 'Guest'

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { isActive: true } })
      const validatedItems = body.items.map((item) => {
        const qty = Number(item?.qty)
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
          throw new BadRequestException('Jumlah produk tidak valid')
        }
        const displayName = typeof item?.name === 'string' ? item.name.trim() : ''
        const product = item.productId
          ? products.find((candidate) => candidate.id === item.productId)
          : products
              .slice()
              .sort((a, b) => b.name.length - a.name.length)
              .find((candidate) => displayName === candidate.name || displayName.startsWith(`${candidate.name} `))
        if (!product) throw new BadRequestException(`Produk tidak tersedia: ${displayName || item.productId}`)
        if (product.stock !== null && product.stock < qty) {
          throw new ConflictException(`Stok ${product.name} tidak cukup`)
        }
        return {
          productId: product.id,
          name: displayName || product.name,
          qty,
          price: product.price,
          trackedStock: product.stock !== null,
        }
      })

      for (const item of validatedItems) {
        if (!item.trackedStock) continue
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        })
        if (result.count !== 1) throw new ConflictException(`Stok ${item.name} tidak cukup`)
      }

      return tx.order.create({
        data: {
          id: `ORD-${randomUUID().slice(0, 8).toUpperCase()}`,
          customerName,
          tableNumber,
          status: 'pending',
          paymentStatus: 'unpaid',
          total: validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0),
          createdAt: new Date(),
          items: {
            create: validatedItems.map(({ productId, name, qty, price }) => ({ productId, name, qty, price })),
          },
        },
        include: { items: true },
      })
    })

    return order
  }

  async updateStatus(id: string, status: 'cooking' | 'ready', user: SessionUser) {
    const order = await this.requireOrder(id)
    const allowedTransitions: Record<string, string[]> = { pending: ['cooking'], cooking: ['ready'], ready: [] }
    if (!allowedTransitions[order.status]?.includes(status)) {
      throw new ConflictException(`Status ${order.status} tidak dapat diubah menjadi ${status}`)
    }
    const updated = await this.prisma.order.update({ where: { id }, data: { status }, include: { items: true } })
    await this.audit.record(user, 'ORDER_STATUS_CHANGED', { orderId: id, metadata: { from: order.status, to: status } })
    return updated
  }

  async voidOrder(id: string, reason: string, user: SessionUser) {
    const order = await this.requireOrder(id)
    const cleanReason = this.requireReason(reason)
    if (order.paymentStatus === 'paid') throw new ConflictException('Pesanan lunas harus direfund, bukan di-void')
    if (['voided', 'refunded'].includes(order.status)) throw new ConflictException('Pesanan sudah dibatalkan')

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.productId) continue
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (product?.stock !== null) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } })
        }
      }
      return tx.order.update({
        where: { id },
        data: { status: 'voided', voidedAt: new Date(), voidReason: cleanReason },
        include: { items: true },
      })
    })
    await this.audit.record(user, 'ORDER_VOIDED', { orderId: id, reason: cleanReason })
    return updated
  }

  async updatePayment(id: string, paymentMethod: 'cash' | 'qris', paymentAmount: number | undefined, user: SessionUser) {
    const order = await this.requireOrder(id)
    if (order.status !== 'ready') throw new ConflictException('Hanya pesanan siap yang dapat dibayar')
    if (order.paymentStatus === 'paid') throw new ConflictException('Pesanan sudah dibayar')
    if (!['cash', 'qris'].includes(paymentMethod)) throw new BadRequestException('Metode pembayaran tidak valid')

    const amount = paymentMethod === 'qris' ? order.total : Number(paymentAmount)
    if (!Number.isInteger(amount) || amount < order.total) {
      throw new BadRequestException('Nominal pembayaran kurang dari total')
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id, status: 'ready', paymentStatus: 'unpaid' },
        data: {
          paymentStatus: 'paid', paymentMethod, paymentAmount: amount,
          changeAmount: amount - order.total, paidAt: new Date(), paidById: user.id,
        },
      })
      if (result.count !== 1) throw new ConflictException('Pesanan sudah diproses oleh kasir lain')
      return tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } })
    })
    await this.audit.record(user, 'ORDER_PAID', { orderId: id, metadata: { paymentMethod, amount } })
    return updated
  }

  async refund(id: string, reason: string, user: SessionUser) {
    const order = await this.requireOrder(id)
    const cleanReason = this.requireReason(reason)
    if (order.paymentStatus !== 'paid') throw new ConflictException('Hanya pesanan lunas yang dapat direfund')
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id, paymentStatus: 'paid' },
        data: { status: 'refunded', paymentStatus: 'refunded', refundedAt: new Date(), refundReason: cleanReason },
      })
      if (result.count !== 1) throw new ConflictException('Pesanan sudah direfund oleh pengguna lain')
      return tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } })
    })
    await this.audit.record(user, 'ORDER_REFUNDED', { orderId: id, reason: cleanReason, metadata: { total: order.total } })
    return updated
  }

  private async requireOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) throw new NotFoundException(`Pesanan ${id} tidak ditemukan`)
    return order
  }

  private requireReason(reason: string) {
    const clean = typeof reason === 'string' ? reason.trim().slice(0, 500) : ''
    if (clean.length < 3) throw new BadRequestException('Alasan minimal 3 karakter')
    return clean
  }

}
