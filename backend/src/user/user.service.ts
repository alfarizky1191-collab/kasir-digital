import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { hash } from 'bcryptjs'

import { PrismaService } from '../prisma/prisma.service'
import { ROLES, type Role } from '../auth/auth.types'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(body: any) {
    const username = body?.username?.trim().toLowerCase()
    const name = body?.name?.trim()
    const password = body?.password
    const role = body?.role as Role
    if (!username || !/^[a-z0-9._-]{3,40}$/.test(username)) {
      throw new BadRequestException('Username tidak valid')
    }
    if (!name || name.length > 80) throw new BadRequestException('Nama tidak valid')
    if (typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException('Password minimal 8 karakter')
    }
    if (!ROLES.includes(role)) throw new BadRequestException('Role tidak valid')

    try {
      return await this.prisma.user.create({
        data: { username, name, passwordHash: await hash(password, 12), role },
        select: { id: true, username: true, name: true, role: true, isActive: true },
      })
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Username sudah digunakan')
      throw error
    }
  }

  async update(id: string, body: any) {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Pengguna tidak ditemukan')
    const role = body?.role as Role | undefined
    if (role && !ROLES.includes(role)) throw new BadRequestException('Role tidak valid')
    const passwordHash = body?.password
      ? await hash(String(body.password), 12)
      : undefined
    if (body?.password && String(body.password).length < 8) {
      throw new BadRequestException('Password minimal 8 karakter')
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        name: body?.name?.trim()?.slice(0, 80) || undefined,
        role,
        isActive: typeof body?.isActive === 'boolean' ? body.isActive : undefined,
        passwordHash,
      },
      select: { id: true, username: true, name: true, role: true, isActive: true },
    })
  }
}
