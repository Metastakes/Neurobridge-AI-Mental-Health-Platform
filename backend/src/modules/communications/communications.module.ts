import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [SmsService, EmailService],
  exports: [SmsService, EmailService],
})
export class CommunicationsModule {}
