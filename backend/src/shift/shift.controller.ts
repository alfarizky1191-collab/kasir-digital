import {
  Body,
  Controller,
  Get,
  Post,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'

import { ShiftService } from './shift.service'

@Controller('api/shifts')
export class ShiftController {
  constructor(
    private readonly shiftService: ShiftService,
  ) {}

  @Get('active')
  async getActiveShift() {
    try {
      const data = await this.shiftService.getActiveShift()

      return { success: true, data }
    } catch (err) {
      if (err instanceof NotFoundException) throw err

      throw new HttpException(
        {
          success: false,
          message:
            err?.message || 'Failed to get active shift',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get()
  async getAllShifts() {
    try {
      const data = await this.shiftService.getAllShifts()

      return { success: true, data }
    } catch (err) {
      if (err instanceof NotFoundException) throw err

      throw new HttpException(
        {
          success: false,
          message:
            err?.message || 'Failed to get shifts',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('open')
  async openShift(
    @Body()
    body: {
      cashierName: string
      openingCash: number
    },
  ) {
    try {
      const payload = {
        cashierName: body.cashierName,
        openingCash: Number(body.openingCash) || 0,
      }

      const data = await this.shiftService.openShift(payload)

      return { success: true, data }
    } catch (err) {
      if (err instanceof NotFoundException) throw err

      throw new HttpException(
        {
          success: false,
          message:
            err?.message || 'Failed to open shift',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('close')
  async closeShift(
    @Body()
    body: {
      shiftId: string
      actualCash: number
      expectedCash: number
      notes?: string
    },
  ) {
    try {
      const payload = {
        shiftId: body.shiftId,
        actualCash: Number(body.actualCash) || 0,
        expectedCash: Number(body.expectedCash) || 0,
        notes: body.notes,
      }

      const data = await this.shiftService.closeShift(payload)

      return { success: true, data }
    } catch (err) {
      if (err instanceof NotFoundException) throw err

      throw new HttpException(
        {
          success: false,
          message:
            err?.message || 'Failed to close shift',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}