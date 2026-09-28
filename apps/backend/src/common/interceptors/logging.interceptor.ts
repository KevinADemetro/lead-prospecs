import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.write(request, response, started),
        error: () => this.write(request, response, started),
      }),
    );
  }

  private write(request: Request, response: Response, started: number): void {
    this.logger.log({
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl?.split('?')[0],
      status: response.statusCode,
      ms: Date.now() - started,
      userId: request.currentUser?.id,
    });
  }
}
