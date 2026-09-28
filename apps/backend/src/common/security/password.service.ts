import { Injectable, OnModuleInit } from '@nestjs/common';
import * as argon2 from 'argon2';
import { EnvService } from '../../config/env.service';

@Injectable()
export class PasswordService implements OnModuleInit {
  private dummyHash = '';

  constructor(private readonly env: EnvService) {}

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.hash('dummy-password-used-only-for-timing');
  }

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: this.env.values.ARGON2_MEMORY_COST,
      timeCost: this.env.values.ARGON2_TIME_COST,
      parallelism: 1,
    });
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }

  async verifyDummy(plain: string): Promise<void> {
    try {
      await argon2.verify(this.dummyHash || (await this.hash('dummy')), plain);
    } catch {
      // timing pad only
    }
  }
}
