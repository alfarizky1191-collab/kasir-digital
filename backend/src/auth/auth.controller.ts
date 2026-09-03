import { Body, Controller, Get, Post, Res } from '@nestjs/common'
import type { Response } from 'express'

import { AuthService } from './auth.service'
import { Public } from './public.decorator'
import { CurrentUser } from './current-user.decorator'
import type { SessionUser } from './auth.types'

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(body.username, body.password)
    response.cookie('pos_session', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/',
    })
    return { user: result.user }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('pos_session', { path: '/' })
    return { success: true }
  }

  @Get('me')
  me(@CurrentUser() user: SessionUser) {
    return { user }
  }
}
