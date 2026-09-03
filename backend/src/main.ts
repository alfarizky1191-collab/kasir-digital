import { createApp } from './create-app'

async function bootstrap() {
  const app = await createApp()

  const port = process.env.PORT || 3001

  await app.listen(port)

  console.log(`Backend running on port ${port}`)
}

bootstrap()
