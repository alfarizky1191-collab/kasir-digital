import { Injectable, UnauthorizedException } from '@nestjs/common'
import { compare } from 'bcryptjs'
import { sign } from 'jsonwebtoken'

import { PrismaService } from '../prisma/prisma.service'
import type { Role, SessionUser } from './auth.types'

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(usernameInput: string, password: string) {
    const username = usernameInput?.trim().toLowerCase()
    if (!username || !password) throw new UnauthorizedException('Username atau password salah')

    const account = await this.prisma.user.findUnique({ where: { username } })
    if (!account?.isActive || !(await compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Username atau password salah')
    }

    const user: SessionUser = {
      id: account.id,
      username: account.username,
      name: account.name,
      role: account.role as Role,
    }
    return { user, token: sign(user, this.secret(), { expiresIn: '12h' }) }
  }

  private secret() {
    const secret = process.env.JWT_SECRET
    if (secret) return secret
    if (process.env.NODE_ENV !== 'production') return 'local-development-only-secret'
    throw new Error('JWT_SECRET is required in production')
  }
}
