import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  register(dto: RegisterDto) {
    return 'This action registers a new user';
  }

  login(dto: LoginDto) {
    return 'This action authenticates a user';
  }

  getMe(req: any) {
    return `This action returns logged in user`;
  }

  changePassword(req: any, changePasswordData: ChangePasswordDto) {
    return `This action changes password`;
  }
}
