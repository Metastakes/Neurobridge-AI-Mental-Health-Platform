import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post('evaluate')
  async evaluateCodes(@Body() data: { encounterId: string }) {
    return this.billingService.evaluateCodes(data.encounterId);
  }

  @Post('save')
  async saveCodes(@Body() data: { encounterId: string; codes: any }) {
    return this.billingService.saveCodes(data.encounterId, data.codes);
  }
}
