import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { User } from '../../database/entities/user.entity.js';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto/index.js';

interface JwtPayload {
  sub: string;
  email: string;
}

interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(this.configService.get<string>('REDIS_URL')!);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.debug(`Registering user: ${dto.email}`);

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    await this.userRepository.save(user);

    return this.generateAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.debug(`Login attempt: ${dto.email}`);

    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async refreshToken(userId: string, tokenId: string): Promise<AuthResponseDto> {
    this.logger.debug(`Refreshing token for user: ${userId}`);

    const isValid = await this.validateRefreshToken(userId, tokenId);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Invalidate old token (rotation)
    await this.revokeRefreshToken(userId, tokenId);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateAuthResponse(user);
  }

  async logout(userId: string, tokenId: string): Promise<void> {
    this.logger.debug(`Logout user: ${userId}`);
    await this.revokeRefreshToken(userId, tokenId);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findOrCreateGoogleUser(profile: {
    email: string;
    name: string;
    picture?: string;
  }): Promise<User> {
    this.logger.debug(`Google OAuth for: ${profile.email}`);

    let user = await this.userRepository.findOne({
      where: { email: profile.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture || null,
        passwordHash: null,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async generateAuthResponse(user: User): Promise<AuthResponseDto> {
    const tokenId = uuidv4();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user.id, tokenId);

    // Store refresh token in Redis
    await this.storeRefreshToken(user.id, tokenId);

    return {
      accessToken,
      user: this.mapUserToDto(user),
      // Note: refreshToken is set as httpOnly cookie in controller
      _refreshToken: refreshToken,
    } as AuthResponseDto & { _refreshToken: string };
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: 15 * 60, // 15 minutes in seconds
    });
  }

  private generateRefreshToken(userId: string, tokenId: string): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  }

  private async storeRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.redis.set(key, 'true', 'EX', ttl);
  }

  private async validateRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    const key = `refresh:${userId}:${tokenId}`;
    const exists = await this.redis.get(key);
    return exists === 'true';
  }

  private async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    await this.redis.del(key);
  }

  private mapUserToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
