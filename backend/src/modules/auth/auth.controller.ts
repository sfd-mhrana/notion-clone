import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/index.js';
import { Public } from './decorators/index.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { User } from '../../database/entities/user.entity.js';

interface RequestWithUser extends Request {
  user: { sub: string; tokenId: string } | User;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, (result as AuthResponseDto & { _refreshToken: string })._refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, (result as AuthResponseDto & { _refreshToken: string })._refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { sub: userId, tokenId } = req.user as { sub: string; tokenId: string };
    const result = await this.authService.refreshToken(userId, tokenId);
    this.setRefreshTokenCookie(res, (result as AuthResponseDto & { _refreshToken: string })._refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const { sub: userId, tokenId } = req.user as { sub: string; tokenId: string };
    await this.authService.logout(userId, tokenId);
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth(): void {
    // Guard handles redirect to Google
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user as User;
    const result = await this.authService.generateAuthResponse(user);
    this.setRefreshTokenCookie(res, (result as AuthResponseDto & { _refreshToken: string })._refreshToken);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}`);
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/api/auth',
    });
  }
}
