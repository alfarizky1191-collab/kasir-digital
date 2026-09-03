import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { verify } from 'jsonwebtoken'

import { IS_PUBLIC_KEY } from './public.decorator'
import type { SessionUser } from './auth.types'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])) return true

    const request = context.switchToHttp().getRequest()
    const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, '')
    const cookies = this.parseCookies(request.headers.cookie)
    const token = bearer || cookies.pos_session
    if (!token) throw new UnauthorizedException('Silakan login')

    try {
      const session = verify(token, this.secret()) as SessionUser
      const account = await this.prisma.user.findUnique({ where: { id: session.id } })
      if (!account?.isActive) throw new Error('Inactive account')
      request.user = {
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role,
      } as SessionUser
      return true
    } catch {
      throw new UnauthorizedException('Sesi tidak valid atau sudah berakhir')
    }
  }

  private secret() {
    const secret = process.env.JWT_SECRET
    if (secret) return secret
    if (process.env.NODE_ENV !== 'production') return 'local-development-only-secret'
    throw new Error('JWT_SECRET is required in production')
  }

  private parseCookies(header?: string) {
    return Object.fromEntries(
      (header || '').split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
        const index = part.indexOf('=')
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      }),
    )
  }
}
