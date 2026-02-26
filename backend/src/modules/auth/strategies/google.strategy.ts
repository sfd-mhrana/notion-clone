import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service.js';
import { User } from '../../../database/entities/user.entity.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || '';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const { emails, displayName, photos } = profile;

    const email = emails?.[0]?.value;
    if (!email) {
      throw new Error('No email found in Google profile');
    }

    const user = await this.authService.findOrCreateGoogleUser({
      email,
      name: displayName || email.split('@')[0],
      picture: photos?.[0]?.value,
    });

    return user;
  }
}
