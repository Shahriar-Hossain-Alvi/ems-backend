import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetMeResponseDto } from './dto/auth-response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
  Endpoints:
  POST	/auth/register: Creates pending account
  POST	/auth/login: Authenticates approved users
  GET	/auth/me: Returns the authenticated user's information
  PATCH	/auth/change-password: Changes the authenticated user's password
  */

  @ApiOperation({
    summary: 'Register a new user. But will be pending for approval.',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login with email and password.' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: "Get the authenticated user's information." })
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Returns the authenticated user.',
    type: GetMeResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest): Promise<GetMeResponseDto> {
    return this.authService.getMe(req.user.sub);
  }

  @ApiOperation({ summary: "Change the authenticated user's password." })
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.sub, dto);
  }
}
