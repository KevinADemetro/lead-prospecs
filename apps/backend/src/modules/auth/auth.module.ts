import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { EnvService } from '../../config/env.service';
import { PersistenceModule } from '../../database/persistence.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PersistenceModule,
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        secret: env.values.JWT_ACCESS_SECRET,
        signOptions: {
          expiresIn: env.values.JWT_ACCESS_EXPIRES_IN as JwtSignOptions['expiresIn'],
          algorithm: 'HS256',
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
