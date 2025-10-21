import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /**
   * Login with email and password (demo/dev only)
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        provider: true,
        mentor: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      // For demo accounts without password
      if (password !== 'password') {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // Generate JWT
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        patient: user.patient,
        provider: user.provider,
        mentor: user.mentor,
      },
      token,
    };
  }

  /**
   * Google OAuth login (placeholder - implement with passport-google-oauth20)
   */
  async googleLogin(googleToken: string) {
    // TODO: Verify Google token
    // TODO: Create or find user
    // TODO: Generate JWT
    throw new Error('Google OAuth not yet implemented');
  }

  /**
   * Verify JWT token
   */
  async verify(token: string) {
    try {
      const payload = this.jwt.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          patient: true,
          provider: true,
          mentor: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
