import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service.js';
import { User } from '../../../database/entities/user.entity.js';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID') || '';
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET') || '';
    const callbackURL = configService.get<string>('GITHUB_CALLBACK_URL') || '';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const { emails, displayName, photos, username } = profile;

    const email = emails?.[0]?.value;
    if (!email) {
      throw new Error('No email found in GitHub profile');
    }

    // Reuse the same OAuth user creation logic as Google
    const user = await this.authService.findOrCreateGoogleUser({
      email,
      name: displayName || username || email.split('@')[0],
      picture: photos?.[0]?.value,
    });

    return user;
  }
}
