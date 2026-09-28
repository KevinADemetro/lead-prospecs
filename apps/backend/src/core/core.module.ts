import { Global, Module } from '@nestjs/common';
import { EnvService } from '../config/env.service';
import { PasswordService } from '../common/security/password.service';

@Global()
@Module({
  providers: [EnvService, PasswordService],
  exports: [EnvService, PasswordService],
})
export class CoreModule {}
