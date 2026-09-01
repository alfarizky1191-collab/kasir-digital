import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.enableCors({
    origin: configuredOrigins?.length
      ? configuredOrigins
      : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })

  const port = process.env.PORT || 3001

  await app.listen(port)

  console.log(`Backend running on port ${port}`)
}

bootstrap()
