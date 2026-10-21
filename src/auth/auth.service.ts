import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import { AccountStatus } from '../generated/prisma/enums';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Register a new employee or allow a rejected employee to try again.
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    // Only rejected employee accounts can register again.
    if (existingUser) {
      if (
        existingUser.status !== 'REJECTED' ||
        existingUser.role !== 'EMPLOYEE'
      ) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      const passwordHash = await hashPassword(dto.password);

      const user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          status: AccountStatus.PENDING,
          employee: existingUser.employee
            ? {
                update: {
                  fullName: dto.fullName,
                  phone: dto.phone,
                  designation: dto.designation,
                },
              }
            : {
                create: {
                  empCode: `PENDING-${existingUser.id}`,
                  fullName: dto.fullName,
                  phone: dto.phone,
                  designation: dto.designation,
                },
              },
        },
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
        },
      });
      return {
        message:
          'Registration submitted successfully. Your account is pending approval.',
        user,
      };
    }

    // new user registration
    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'EMPLOYEE',
        status: 'PENDING',
        employee: {
          create: {
            empCode: `PENDING-${randomUUID()}`,
            fullName: dto.fullName,
            phone: dto.phone,
            designation: dto.designation,
          },
        },
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      message:
        'Registration submitted successfully. Your account is pending approval.',
      user,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.status !== 'APPROVED') {
      throw new UnauthorizedException(
        user.status === 'PENDING'
          ? 'Your account is awaiting admin approval.'
          : 'Your account is not approved for access.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }

  // Return the current user's safe profile.
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            empCode: true,
            fullName: true,
            phone: true,
            designation: true,
            joinDate: true,
            status: true,
            departmentId: true,
            structureId: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    return user;
  }

  // Verify the current password before replacing its hash.
  async changePassword(userId: number, dto: ChangePasswordDto) {
    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException(
        'The new password must differ from the current password.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (
      !user ||
      !(await verifyPassword(dto.currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    const passwordHash = await hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return {
      message: 'Password changed successfully.',
    };
  }
}
