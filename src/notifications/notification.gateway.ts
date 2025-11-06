// notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';

interface NotificationPayload {
  to: string[];           // array of userIds
  title: string;
  payload?: any;
  message: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(private userservice: UserService) { }

  private onlineUsers = new Map<string, string>(); // userId → socketId

  // -------------------------------------------------
  // Connection handling (unchanged)
  // -------------------------------------------------
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.onlineUsers.set(userId, client.id);
      console.log(`${userId} online`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [uid, sid] of this.onlineUsers.entries()) {
      if (sid === client.id) {
        this.onlineUsers.delete(uid);
        break;
      }
    }
  }

  // -------------------------------------------------
  // Private chat (unchanged – works with the Flutter client)
  // -------------------------------------------------
  @SubscribeMessage('privateMessage')
  handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { to: string; message: string; from: string },
  ) {
    const recipientSocketId = this.onlineUsers.get(data.to);
    if (recipientSocketId) {
      this.server.to(recipientSocketId).emit('privateMessage', {
        from: data.from,
        message: data.message,
      });
    } else {
      // OPTIONAL: persist to DB and push when user comes online
      console.log('Recipient offline → store in DB');
    } 
  }

  // -------------------------------------------------
  // Generic notification broadcast
  // -------------------------------------------------
  @SubscribeMessage('notification')
  async handleNotification(
    @MessageBody() payload: NotificationPayload,
  ) {
    console.log(payload)
    const socketsToNotify: string[] = [];

    for (const uid of payload.to) {
      const user = await this.userservice.findOneByUsername(uid);
      const sid = this.onlineUsers.get(user?._id.toString() ?? '');
      if (sid) socketsToNotify.push(sid);
    }

    if (socketsToNotify.length > 0) {
      this.server.to(socketsToNotify).emit('notification', {
        title: payload.title,
        payload: payload.payload,
        message: payload.message
      });
    }

    // If some users are offline → store in DB for later push
    const offline = payload.to.filter((u) => !this.onlineUsers.has(u));
    if (offline.length) {
      console.log('Offline users → store notifications:', offline);
      // await this.notificationService.saveForLater(offline, payload);
    }
  }




}