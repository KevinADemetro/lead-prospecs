import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EnvService } from '../../config/env.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly env: EnvService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Erro interno';
    let error = 'Internal Server Error';

    if (isHttp) {
      const payload = exception.getResponse();
      error = HttpStatus[status] ?? 'Error';
      if (typeof payload === 'string') {
        message = payload;
      } else if (typeof payload === 'object' && payload && 'message' in payload) {
        const raw = (payload as { message: string | string[] }).message;
        message = Array.isArray(raw) ? raw[0] ?? exception.message : raw;
      } else {
        message = exception.message;
      }
    }

    if (!this.env.values.isProduction && !isHttp && exception instanceof Error) {
      this.logger.error(
        {
          requestId: request.requestId,
          path: request.originalUrl,
          method: request.method,
          err: exception.message,
        },
        exception.stack,
      );
    } else if (!isHttp) {
      this.logger.error({
        requestId: request.requestId,
        path: request.originalUrl,
        method: request.method,
        status,
      });
    }

    if (this.env.values.isProduction && status >= 500) {
      message = 'Erro interno';
      error = 'Internal Server Error';
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      requestId: request.requestId,
    });
  }
}
