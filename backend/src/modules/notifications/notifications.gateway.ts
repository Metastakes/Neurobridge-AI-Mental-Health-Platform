/**
 * INNOVATION: Real-time WebSocket Notifications
 * Provides instant crisis alerts and system notifications to providers
 *
 * DEPENDENCIES REQUIRED (add to package.json):
 * - @nestjs/websockets
 * - @nestjs/platform-socket.io
 * - socket.io
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  providerId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedProviders = new Map<string, Set<string>>(); // providerId -> Set of socketIds

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Handle new client connections
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted connection without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const decoded = await this.jwtService.verifyAsync(token);
      client.userId = decoded.id;
      client.providerId = decoded.providerId || decoded.id;

      // Track provider connection
      if (!this.connectedProviders.has(client.providerId)) {
        this.connectedProviders.set(client.providerId, new Set());
      }
      this.connectedProviders.get(client.providerId).add(client.id);

      // Join provider-specific room
      client.join(`provider:${client.providerId}`);

      this.logger.log(`Provider ${client.providerId} connected (socket: ${client.id})`);
      this.logger.log(`Total connected providers: ${this.connectedProviders.size}`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notification server',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnections
   */
  handleDisconnect(client: AuthenticatedSocket) {
    if (client.providerId) {
      const sockets = this.connectedProviders.get(client.providerId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.connectedProviders.delete(client.providerId);
        }
      }
      this.logger.log(`Provider ${client.providerId} disconnected (socket: ${client.id})`);
    } else {
      this.logger.log(`Client ${client.id} disconnected`);
    }
  }

  /**
   * Handle ping from client (keep-alive)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  /**
   * Send crisis alert to specific provider
   */
  sendCrisisAlert(providerId: string, alert: any) {
    const roomName = `provider:${providerId}`;

    this.server.to(roomName).emit('crisis_alert', {
      type: 'crisis_alert',
      severity: 'critical',
      alert,
      timestamp: new Date().toISOString(),
    });

    this.logger.warn(`Crisis alert sent to provider ${providerId}: Patient ${alert.patientId}`);
  }

  /**
   * Send risk alert to specific provider
   */
  sendRiskAlert(providerId: string, alert: any) {
    const roomName = `provider:${providerId}`;

    this.server.to(roomName).emit('risk_alert', {
      type: 'risk_alert',
      severity: alert.severity || 'medium',
      alert,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Risk alert sent to provider ${providerId}: ${alert.kind}`);
  }

  /**
   * Send safety check request notification
   */
  sendSafetyCheckRequest(providerId: string, request: any) {
    const roomName = `provider:${providerId}`;

    this.server.to(roomName).emit('safety_check_request', {
      type: 'safety_check_request',
      severity: 'high',
      request,
      timestamp: new Date().toISOString(),
    });

    this.logger.warn(`Safety check request sent to provider ${providerId}: Patient ${request.patientId}`);
  }

  /**
   * Send general notification to provider
   */
  sendNotification(providerId: string, notification: any) {
    const roomName = `provider:${providerId}`;

    this.server.to(roomName).emit('notification', {
      type: 'notification',
      severity: notification.severity || 'info',
      notification,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Notification sent to provider ${providerId}`);
  }

  /**
   * Broadcast system-wide announcement
   */
  broadcastAnnouncement(announcement: any) {
    this.server.emit('announcement', {
      type: 'announcement',
      severity: 'info',
      announcement,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`System announcement broadcast: ${announcement.title}`);
  }

  /**
   * Get online provider count
   */
  getOnlineProviderCount(): number {
    return this.connectedProviders.size;
  }

  /**
   * Check if provider is online
   */
  isProviderOnline(providerId: string): boolean {
    return this.connectedProviders.has(providerId);
  }

  /**
   * Get all connected provider IDs
   */
  getConnectedProviderIds(): string[] {
    return Array.from(this.connectedProviders.keys());
  }
}
