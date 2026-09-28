import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (!MUTATING.has(request.method)) {
      return next.handle();
    }

    const handler = context.getHandler().name;
    const entity = context.getClass().name.replace(/Controller$/, '').toLowerCase();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log({
            who: request.currentUser?.id ?? 'anonymous',
            action: handler,
            entity,
            entityId: request.params['id'],
            result: 'success',
            status: response.statusCode,
            requestId: request.requestId,
            at: new Date().toISOString(),
          });
        },
        error: () => {
          this.logger.warn({
            who: request.currentUser?.id ?? 'anonymous',
            action: handler,
            entity,
            entityId: request.params['id'],
            result: 'failure',
            requestId: request.requestId,
            at: new Date().toISOString(),
          });
        },
      }),
    );
  }
}
