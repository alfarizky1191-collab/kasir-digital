import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'

import { Server } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*',
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