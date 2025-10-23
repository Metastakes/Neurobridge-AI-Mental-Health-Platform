import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
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
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}
