import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationHistoryService } from './notification-history.service';
import { NotificationHistoryController } from './notification-history.controller';
import { CommunicationsModule } from '../communications/communications.module';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'neurobridge-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    CommunicationsModule,
    PrismaModule,
  ],
  controllers: [
    NotificationPreferencesController,
    NotificationHistoryController,
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationPreferencesService,
    NotificationHistoryService,
  ],
  exports: [
    NotificationsGateway,
    NotificationsService,
    NotificationPreferencesService,
    NotificationHistoryService,
  ],
})
export class NotificationsModule {}
