import { Body, Controller, Get, Post } from '@nestjs/common'

import { ShiftService } from './shift.service'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../auth/current-user.decorator'
import type { SessionUser } from '../auth/auth.types'

@Controller('api/shifts')
export class ShiftController {
  constructor(private readonly shifts: ShiftService) {}

  @Get('active')
  async getActiveShift() {
    return { success: true, data: await this.shifts.getActiveShift() }
  }

  @Roles('owner', 'admin')
  @Get()
  async getAllShifts() {
    return { success: true, data: await this.shifts.getAllShifts() }
  }

  @Roles('owner', 'admin', 'cashier')
  @Post('open')
  async openShift(
    @Body('openingCash') openingCash: number,
    @CurrentUser() user: SessionUser,
  ) {
    const data = await this.shifts.openShift({ cashierName: user.name, openingCash: Number(openingCash) }, user)
    return { success: true, data }
  }

  @Roles('owner', 'admin', 'cashier')
  @Post('close')
  async closeShift(
    @Body() body: { shiftId: string; actualCash: number; notes?: string },
    @CurrentUser() user: SessionUser,
  ) {
    const data = await this.shifts.closeShift(
      { shiftId: body.shiftId, actualCash: Number(body.actualCash), notes: body.notes },
      user,
    )
    return { success: true, data }
  }
}
