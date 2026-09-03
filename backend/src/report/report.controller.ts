import { Controller, Get, Query } from '@nestjs/common'
import { Roles } from '../auth/roles.decorator'
import { ReportService } from './report.service'

@Roles('owner', 'admin')
@Controller('api/reports')
export class ReportController {
  constructor(private reports: ReportService) {}
  @Get('summary')
  summary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.summary(from, to)
  }
}
