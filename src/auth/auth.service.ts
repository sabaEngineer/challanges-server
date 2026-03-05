import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { formatUserForResponse } from '../users/badge';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client();
  }

  async googleLogin(idToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyGoogleToken(idToken);

    const user = await this.usersService.findOrCreateByGoogle({
      googleId: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      picture: payload.picture,
    });

    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: formatUserForResponse(user, {
        email: user.email,
        skip_build_team: user.skip_build_team,
      }) as AuthResponseDto['user'],
    };
  }

  private async verifyGoogleToken(idToken: string) {
    try {
      const allowedClientIds = [
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_CLIENT_ID_IOS'),
      ].filter(Boolean);

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: allowedClientIds,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  async validateUserById(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
