import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard as NestThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottleGuard extends NestThrottlerGuard {
  protected throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests. Please try again later.',
        error: 'ThrottlerException',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
