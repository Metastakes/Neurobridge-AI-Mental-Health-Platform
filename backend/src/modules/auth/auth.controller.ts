import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() data: { email: string; password: string }) {
    return this.authService.login(data.email, data.password);
  }

  @Post('google')
  @ApiOperation({ summary: 'Login with Google OAuth' })
  async googleLogin(@Body() data: { token: string }) {
    return this.authService.googleLogin(data.token);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify JWT token' })
  async verify(@Body() data: { token: string }) {
    return this.authService.verify(data.token);
  }
}
