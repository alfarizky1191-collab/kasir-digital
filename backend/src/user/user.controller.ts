import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'
import { Roles } from '../auth/roles.decorator'
import { UserService } from './user.service'

@Roles('owner')
@Controller('api/users')
export class UserController {
  constructor(private users: UserService) {}
  @Get() list() { return this.users.list() }
  @Post() create(@Body() body: unknown) { return this.users.create(body) }
  @Patch(':id') update(@Param('id') id: string, @Body() body: unknown) {
    return this.users.update(id, body)
  }
}
