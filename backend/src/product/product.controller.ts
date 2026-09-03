import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common'

import { ProductService } from './product.service'
import { Public } from '../auth/public.decorator'
import { Roles } from '../auth/roles.decorator'

@Controller('api/products')
export class ProductController {
  constructor(private products: ProductService) {}

  @Public()
  @Get()
  list() {
    return this.products.list(true)
  }

  @Roles('owner', 'admin')
  @Get('admin/all')
  listAll() { return this.products.list(false) }

  @Roles('owner', 'admin')
  @Post()
  create(@Body() body: unknown) {
    return this.products.create(body)
  }

  @Roles('owner', 'admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.products.update(id, body)
  }

  @Roles('owner', 'admin')
  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.products.setActive(id, Boolean(isActive))
  }
}
