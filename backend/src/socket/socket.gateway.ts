import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server, Socket } from 'socket.io'
import { verify } from 'jsonwebtoken'

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? ['http://localhost:3000'],
  },
})
export class SocketGateway implements OnGatewayConnection {
  @WebSocketServer()
server!: Server

  handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers.cookie || ''
    const token = cookieHeader
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('pos_session='))
      ?.slice('pos_session='.length)

    try {
      const secret = process.env.JWT_SECRET ||
        (process.env.NODE_ENV !== 'production' ? 'local-development-only-secret' : '')
      if (!token || !secret) throw new Error('Missing session')
      verify(decodeURIComponent(token), secret)
    } catch {
      client.disconnect(true)
    }
  }

  emitOrdersUpdated() {
    this.server.emit(
      'ordersUpdated',
    )
  }
}
