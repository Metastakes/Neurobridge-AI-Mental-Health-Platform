import { Module } from '@nestjs/common';
import { SocialSharesService } from './social-shares.service';
import { SocialSharesController } from './social-shares.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SocialSharesController],
  providers: [SocialSharesService],
  exports: [SocialSharesService],
})
export class SocialSharesModule {}
