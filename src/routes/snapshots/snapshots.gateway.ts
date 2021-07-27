import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class SnapshotsGateway {
    @WebSocketServer()
    server: Server;

    emitMessage(message: string, data: any): void {
        this.server.emit(message, data);
    }
}
