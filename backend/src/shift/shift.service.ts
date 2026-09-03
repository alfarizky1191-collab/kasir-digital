import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import type { SessionUser } from '../auth/auth.types'

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  getActiveShift() {
    return this.prisma.shift.findUnique({ where: { activeKey: 'ACTIVE' } })
  }

  getAllShifts() {
    return this.prisma.shift.findMany({ orderBy: { openedAt: 'desc' }, take: 500 })
  }

  async openShift(body: { cashierName: string; openingCash: number }, user?: SessionUser) {
    const cashierName = body.cashierName?.trim()
    if (!cashierName || cashierName.length > 80) {
      throw new BadRequestException('Invalid cashier name')
    }
    if (!Number.isInteger(body.openingCash) || body.openingCash < 0) {
      throw new BadRequestException('Invalid opening cash')
    }
    if (await this.getActiveShift()) {
      throw new ConflictException('A shift is already open')
    }

    try {
      const shift = await this.prisma.shift.create({
        data: {
          id: `SHIFT-${Date.now()}`,
          cashierName,
          openingCash: body.openingCash,
          status: 'open',
          activeKey: 'ACTIVE',
          openedAt: new Date(),
        },
      })
      if (user) {
        await this.audit.record(user, 'SHIFT_OPENED', {
          metadata: { shiftId: shift.id, openingCash: shift.openingCash },
        })
      }
      return shift
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('A shift is already open')
      }
      throw error
    }
  }

  async closeShift(body: { shiftId: string; actualCash: number; notes?: string }, user: SessionUser) {
    if (!Number.isInteger(body.actualCash) || body.actualCash < 0) {
      throw new BadRequestException('Invalid actual cash')
    }

    const shift = await this.prisma.shift.findUnique({ where: { id: body.shiftId } })
    if (!shift || shift.status !== 'open' || shift.activeKey !== 'ACTIVE') {
      throw new NotFoundException('Active shift not found')
    }

    const cashSales = await this.prisma.order.aggregate({
      where: {
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        paidAt: { gte: shift.openedAt },
      },
      _sum: { total: true },
    })
    const expectedCash = shift.openingCash + (cashSales._sum.total ?? 0)

    const closed = await this.prisma.shift.update({
      where: { id: body.shiftId },
      data: {
        status: 'closed',
        activeKey: null,
        actualCash: body.actualCash,
        expectedCash,
        difference: body.actualCash - expectedCash,
        notes: body.notes?.trim().slice(0, 500),
        closingCash: body.actualCash,
        closedAt: new Date(),
      },
    })
    await this.audit.record(user, 'SHIFT_CLOSED', {
      metadata: {
        shiftId: closed.id,
        expectedCash,
        actualCash: body.actualCash,
        difference: closed.difference,
      },
    })
    return closed
  }
}
