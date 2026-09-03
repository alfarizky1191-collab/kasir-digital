import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { ROLES_KEY } from './roles.decorator'
import type { Role, SessionUser } from './auth.types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles?.length) return true

    const user = context.switchToHttp().getRequest().user as SessionUser | undefined
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Anda tidak memiliki akses')
    }
    return true
  }
}
