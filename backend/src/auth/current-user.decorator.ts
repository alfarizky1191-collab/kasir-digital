import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { SessionUser } from './auth.types'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionUser =>
    context.switchToHttp().getRequest().user,
)
