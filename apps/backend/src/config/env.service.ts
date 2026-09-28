import { Injectable } from '@nestjs/common';
import { AppEnv, loadEnv } from './env';

@Injectable()
export class EnvService {
  readonly values: AppEnv;

  constructor() {
    this.values = loadEnv();
  }
}
