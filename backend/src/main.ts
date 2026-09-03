import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.getHttpAdapter().getInstance().set('trust proxy', 1)

  app.use(helmet())
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }))
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }))

  const configuredOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.enableCors({
    origin: configuredOrigins?.length
      ? configuredOrigins
      : ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  })

  const port = process.env.PORT || 3001

  await app.listen(port)

  console.log(`Backend running on port ${port}`)
}

bootstrap()
