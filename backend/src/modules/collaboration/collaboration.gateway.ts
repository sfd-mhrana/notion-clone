import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
// WorkspacesService available for future workspace access validation if needed

interface JwtPayload {
  sub: string;
  email: string;
}

interface UserSocket extends Socket {
  userId: string;
  userName: string;
}

interface BlockUpdateEvent {
  blockId: string;
  content: Record<string, unknown>;
  version: number;
}

interface BlockCreateEvent {
  block: {
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
    parentBlockId?: string;
  };
  pageId: string;
}

interface BlockDeleteEvent {
  blockId: string;
  pageId: string;
}

interface BlockMoveEvent {
  blockId: string;
  newOrder: number;
  newParentId?: string;
  pageId: string;
}

interface CursorMoveEvent {
  pageId: string;
  blockId: string;
  offset: number;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/collaboration',
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CollaborationGateway.name);
  private readonly userColors = new Map<string, string>();
  private readonly pagePresence = new Map<string, Set<string>>(); // pageId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: UserSocket): Promise<void> {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.userId = payload.sub;
      client.userName = payload.email;
      this.userColors.set(client.id, this.generateUserColor());

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Client connection rejected: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: UserSocket): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove from all page presence
    for (const [pageId, sockets] of this.pagePresence) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        this.server.to(`page:${pageId}`).emit('presence:left', {
          userId: client.userId,
        });
      }
    }

    this.userColors.delete(client.id);
  }

  @SubscribeMessage('join:page')
  async handleJoinPage(
    @MessageBody() data: { pageId: string },
    @ConnectedSocket() client: UserSocket,
  ): Promise<void> {
    const { pageId } = data;
    const roomName = `page:${pageId}`;

    // Leave any other page rooms first
    for (const room of client.rooms) {
      if (room.startsWith('page:') && room !== roomName) {
        await client.leave(room);
        const oldPageId = room.replace('page:', '');
        this.pagePresence.get(oldPageId)?.delete(client.id);
        this.server.to(room).emit('presence:left', { userId: client.userId });
      }
    }

    await client.join(roomName);

    // Track presence
    if (!this.pagePresence.has(pageId)) {
      this.pagePresence.set(pageId, new Set());
    }
    this.pagePresence.get(pageId)!.add(client.id);

    // Notify others
    client.to(roomName).emit('presence:joined', {
      userId: client.userId,
      userName: client.userName,
      color: this.userColors.get(client.id),
    });

    this.logger.debug(`User ${client.userId} joined page ${pageId}`);
  }

  @SubscribeMessage('leave:page')
  async handleLeavePage(
    @MessageBody() data: { pageId: string },
    @ConnectedSocket() client: UserSocket,
  ): Promise<void> {
    const { pageId } = data;
    const roomName = `page:${pageId}`;

    await client.leave(roomName);
    this.pagePresence.get(pageId)?.delete(client.id);

    this.server.to(roomName).emit('presence:left', {
      userId: client.userId,
    });

    this.logger.debug(`User ${client.userId} left page ${pageId}`);
  }

  @SubscribeMessage('block:update')
  handleBlockUpdate(
    @MessageBody() data: BlockUpdateEvent,
    @ConnectedSocket() client: UserSocket,
  ): void {
    // Broadcast to all other clients in the same page rooms
    for (const room of client.rooms) {
      if (room.startsWith('page:')) {
        client.to(room).emit('block:updated', {
          ...data,
          userId: client.userId,
        });
      }
    }
  }

  @SubscribeMessage('block:create')
  handleBlockCreate(
    @MessageBody() data: BlockCreateEvent,
    @ConnectedSocket() client: UserSocket,
  ): void {
    const roomName = `page:${data.pageId}`;
    client.to(roomName).emit('block:created', {
      ...data,
      userId: client.userId,
    });
  }

  @SubscribeMessage('block:delete')
  handleBlockDelete(
    @MessageBody() data: BlockDeleteEvent,
    @ConnectedSocket() client: UserSocket,
  ): void {
    const roomName = `page:${data.pageId}`;
    client.to(roomName).emit('block:deleted', {
      ...data,
      userId: client.userId,
    });
  }

  @SubscribeMessage('block:move')
  handleBlockMove(
    @MessageBody() data: BlockMoveEvent,
    @ConnectedSocket() client: UserSocket,
  ): void {
    const roomName = `page:${data.pageId}`;
    client.to(roomName).emit('block:moved', {
      ...data,
      userId: client.userId,
    });
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @MessageBody() data: CursorMoveEvent,
    @ConnectedSocket() client: UserSocket,
  ): void {
    const roomName = `page:${data.pageId}`;
    client.to(roomName).emit('cursor:moved', {
      ...data,
      userId: client.userId,
      userName: client.userName,
      color: this.userColors.get(client.id),
    });
  }

  private generateUserColor(): string {
    const colors = [
      '#f87171', // red
      '#fb923c', // orange
      '#fbbf24', // amber
      '#a3e635', // lime
      '#34d399', // emerald
      '#22d3ee', // cyan
      '#60a5fa', // blue
      '#a78bfa', // violet
      '#f472b6', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
