import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule)

  app.enableCors()

  const port = process.env.PORT || 3001

await app.listen(port)

console.log(`Backend running on port ${port}`)
  console.log(
    'Backend running on http://localhost:3001',
  )
}

bootstrap()