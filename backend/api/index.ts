import 'reflect-metadata'
import type { Request, Response } from 'express'

import { createApp } from '../src/create-app'

let serverPromise: Promise<(request: Request, response: Response) => void> | undefined

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const app = await createApp()
      await app.init()
      return app.getHttpAdapter().getInstance()
    })()
  }

  return serverPromise
}

export default async function handler(request: Request, response: Response) {
  const server = await getServer()
  return server(request, response)
}
