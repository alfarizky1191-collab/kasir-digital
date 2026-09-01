import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? ['http://localhost:3000'],
  },
})
export class SocketGateway {
  @WebSocketServer()
server!: Server

  emitOrdersUpdated() {
    this.server.emit(
      'ordersUpdated',
    )
  }
}
