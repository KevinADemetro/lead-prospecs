import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { changePasswordSchema, loginRequestSchema } from '@app/shared';
import { AuthService } from './auth.service';
import { Public, SkipCsrf } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { COOKIE } from '../../config/constants';
import { clearAuthCookies, setAuthCookies, setCsrfCookie } from '../../config/cookies';
import { EnvService } from '../../config/env.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly env: EnvService,
  ) {}

  @Public()
  @SkipCsrf()
  @Get('csrf')
  csrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = this.auth.csrfToken();
    setCsrfCookie(res, this.env.values, csrfToken);
    return { csrfToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginRequestSchema)) body: { login: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(body.login, body.password, req);
    setAuthCookies(res, this.env.values, result.tokens);
    return { user: result.user };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.refresh(req.cookies?.[COOKIE.REFRESH], req);
    setAuthCookies(res, this.env.values, result.tokens);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[COOKIE.REFRESH]);
    clearAuthCookies(res, this.env.values);
    return { success: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthContext) {
    return { user };
  }

  @Patch('password')
  async changePassword(
    @CurrentUser() user: AuthContext,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: { currentPassword: string; newPassword: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
    clearAuthCookies(res, this.env.values);
    return { success: true };
  }
}
