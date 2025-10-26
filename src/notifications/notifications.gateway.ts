import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws-notifications', cors: { origin: '*' } }) // Adjust CORS for production
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(@ConnectedSocket() client: WebSocket, ...args: any[]) {
    // Extract userId from handshake headers or query (optional: add auth)
    const userId = args[0]?.headers['user-id'] || null;
    if (userId) {
      (client as any).userId = userId; // Store userId on client
      console.log(`Client connected: userId=${userId}`);
    } else {
      console.warn('Client connected without userId');
      client.close(); // Close if no userId (security)
    }
  }

  handleDisconnect(@ConnectedSocket() client: WebSocket) {
    console.log(`Client disconnected: userId=${(client as any).userId}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() data: { userId: string }, @ConnectedSocket() client: WebSocket) {
    // Allow re-subscription or update userId
    (client as any).userId = data.userId;
    console.log(`Client subscribed: userId=${data.userId}`);
    return { event: 'subscribed', data: 'Subscription successful' };
  }

  sendNotification(userId: string, title: string, body: string, payload?: any) {
    if (!this.server) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && (client as any).userId === userId) {
        client.send(JSON.stringify({ title, body, payload }));
      }
    });
  }
}