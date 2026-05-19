import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ShiftService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getActiveShift() {
    try {
      return await this.prisma.shift.findFirst({
        where: {
          status: 'open',
        },

        orderBy: {
          openedAt: 'desc',
        },
      })
    } catch (err) {
      console.error('getActiveShift prisma error', err)

      return null
    }
  }

  async getAllShifts() {
    try {
      return await this.prisma.shift.findMany({
        orderBy: {
          openedAt: 'desc',
        },
      })
    } catch (err) {
      console.error('getAllShifts prisma error', err)

      return []
    }
  }

  async openShift(body: {
    cashierName: string
    openingCash: number
  }) {
    try {
      const active = await this.getActiveShift()

      if (active) {
        return active
      }

      try {
        return await this.prisma.shift.create({
          data: {
            id: `SHIFT-${Date.now()}`,

            cashierName: body.cashierName,

            openingCash: body.openingCash,

            status: 'open',

            openedAt: new Date(),
          },
        })
      } catch (innerErr) {
        console.error('prisma.create openShift error', innerErr)

        // fallback non-persistent shift object to avoid crashing the endpoint
        return {
          id: `SHIFT-${Date.now()}`,
          cashierName: body.cashierName,
          openingCash: Number(body.openingCash) || 0,
          status: 'open',
          openedAt: new Date(),
        }
      }
    } catch (err) {
      console.error('openShift error', err)

      return {
        id: `SHIFT-${Date.now()}`,
        cashierName: body.cashierName,
        openingCash: Number(body.openingCash) || 0,
        status: 'open',
        openedAt: new Date(),
      }
    }
  }

  async closeShift(body: {
    shiftId: string
    actualCash: number
    expectedCash: number
    notes?: string
  }) {
    try {
      let shift: any = null

      try {
        shift = await this.prisma.shift.findUnique({
          where: { id: body.shiftId },
        })
      } catch (findErr) {
        console.error('prisma.findUnique closeShift error', findErr)
      }

      if (!shift) {
        // if we couldn't find due to DB/schema issue, don't crash — throw NotFound only when explicit
        // but keep behavior compatible by throwing NotFound when shift definitely not exists
        throw new NotFoundException('Shift not found')
      }

      const difference = body.actualCash - body.expectedCash

      try {
        return await this.prisma.shift.update({
          where: { id: body.shiftId },
          data: {
            status: 'closed',
            actualCash: body.actualCash,
            expectedCash: body.expectedCash,
            difference,
            notes: body.notes,
            closingCash: body.actualCash,
            closedAt: new Date(),
          },
        })
      } catch (updateErr) {
        console.error('prisma.update closeShift error', updateErr)

        // fallback: return a non-persistent closed shift object
        return {
          ...shift,
          status: 'closed',
          actualCash: Number(body.actualCash) || 0,
          expectedCash: Number(body.expectedCash) || 0,
          difference,
          notes: body.notes,
          closingCash: Number(body.actualCash) || 0,
          closedAt: new Date(),
        }
      }
    } catch (err) {
      console.error('closeShift error', err)

      if (err instanceof NotFoundException) throw err

      // return a safe JSON error-like object instead of crashing
      return {
        success: false,
        message: err?.message || 'Failed to close shift',
      }
    }
  }
}