import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  list(activeOnly = true) {
    return this.prisma.product.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
  }

  async create(body: any) {
    const data = this.validate(body)
    try {
      return await this.prisma.product.create({ data })
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Nama produk sudah dipakai')
      throw error
    }
  }

  async update(id: string, body: any) {
    if (!(await this.prisma.product.findUnique({ where: { id } }))) {
      throw new NotFoundException('Produk tidak ditemukan')
    }
    const data = this.validate(body)
    return this.prisma.product.update({ where: { id }, data })
  }

  async setActive(id: string, isActive: boolean) {
    try {
      return await this.prisma.product.update({ where: { id }, data: { isActive } })
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Produk tidak ditemukan')
      throw error
    }
  }

  private validate(body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const category = typeof body?.category === 'string' ? body.category.trim() : 'Menu'
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl.trim() : null
    const price = Number(body?.price)
    const stock = body?.stock === '' || body?.stock == null ? null : Number(body.stock)
    const flavors = Array.isArray(body?.flavors)
      ? body.flavors.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 20)
      : []

    if (!name || name.length > 120) throw new BadRequestException('Nama produk tidak valid')
    if (!Number.isInteger(price) || price < 0 || price > 1_000_000_000) {
      throw new BadRequestException('Harga tidak valid')
    }
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      throw new BadRequestException('Stok tidak valid')
    }
    if (imageUrl && !/^https:\/\/i\.imgur\.com\//i.test(imageUrl)) {
      throw new BadRequestException('Gunakan URL gambar HTTPS dari i.imgur.com')
    }

    return {
      name,
      category: category.slice(0, 80) || 'Menu',
      imageUrl: imageUrl || null,
      price,
      stock,
      isActive: body?.isActive !== false,
      hasLevel: Boolean(body?.hasLevel),
      hasType: Boolean(body?.hasType),
      flavors,
    }
  }
}
