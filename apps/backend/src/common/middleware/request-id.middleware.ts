import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { HEADER } from '../../config/constants';
import { createRequestId } from '../security/crypto.util';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header(HEADER.REQUEST_ID);
    const requestId =
      incoming && /^[a-zA-Z0-9-]{8,64}$/.test(incoming) ? incoming : createRequestId();
    req.requestId = requestId;
    res.setHeader(HEADER.REQUEST_ID, requestId);
    next();
  }
}
