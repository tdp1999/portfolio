import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
    if (!clientID || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
    }
    super({
      clientID,
      clientSecret,
      callbackURL:
        process.env['GOOGLE_CALLBACK_URL'] || 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { emails?: { value: string }[]; displayName?: string; id: string },
    done: VerifyCallback
  ): void {
    const user = {
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName ?? '',
      googleId: profile.id,
    };
    done(null, user);
  }
}
