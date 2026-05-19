import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createLog(body: {
    action: string
    reason?: string
    orderId?: string
    cashierName: string
  }) {
    return this.prisma.auditLog.create({
      data: {
        id: `LOG-${Date.now()}`,

        action: body.action,

        reason: body.reason,

        orderId: body.orderId,

        cashierName:
          body.cashierName,

        createdAt: new Date(),
      },
    })
  }

  async getLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
  }
}