import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

/**
 * Interceptor to automatically audit API calls
 * Use @UseInterceptors(AuditInterceptor) on controllers/routes that handle PHI
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Extract resource and action from the route
    const action = `${method}_${url}`;
    const resource = this.extractResourceFromUrl(url);

    return next.handle().pipe(
      tap(() => {
        // Only log if user is authenticated
        if (user?.id) {
          this.auditService.log({
            userId: user.id,
            action,
            resource,
            resourceId: request.params?.id,
            ipAddress: ip,
            userAgent: headers['user-agent'],
            metadata: {
              method,
              url,
              query: request.query,
            },
          });
        }
      }),
    );
  }

  private extractResourceFromUrl(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // Extract main resource (e.g., /api/patients/123 -> "Patient")
    const resource = parts[1] || 'Unknown';
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  }
}
