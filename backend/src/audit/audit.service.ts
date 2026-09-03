import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import type { SessionUser } from '../auth/auth.types'

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  record(
    user: SessionUser,
    action: string,
    details?: { reason?: string; orderId?: string; metadata?: Prisma.InputJsonValue },
  ) {
    return this.prisma.auditLog.create({
      data: {
        id: `LOG-${randomUUID()}`,
        action,
        reason: details?.reason,
        orderId: details?.orderId,
        cashierName: user.name,
        userId: user.id,
        metadata: details?.metadata,
        createdAt: new Date(),
      },
    })
  }

  getLogs() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
  }
}
