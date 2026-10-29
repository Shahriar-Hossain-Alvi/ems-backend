import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { GetMyAttendanceQueryDto } from './dto/get-my-attendance-query.dto';
import { GetAttendanceQueryDto } from './dto/get-attendance-query.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/utils/decorators/permissions.decorator';
import { CorrectAttendanceDto } from './dto/correct-attendance.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('today')
  @Permissions('EMPLOYEE')
  @ApiOperation({
    summary: 'Get the authenticated employee attendance status for today',
  })
  getToday(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.getToday(req.user.sub);
  }

  @Post('clock-in')
  @Permissions('EMPLOYEE')
  @ApiOperation({ summary: 'Clock in for today' })
  clockIn(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.clockIn(req.user.sub);
  }

  @Post('clock-out')
  @Permissions('EMPLOYEE')
  @ApiOperation({ summary: 'Clock out and calculate work duration' })
  clockOut(@Req() req: AuthenticatedRequest) {
    return this.attendanceService.clockOut(req.user.sub);
  }

  @Get('me')
  @Permissions('EMPLOYEE')
  @ApiOperation({
    summary: 'Get the authenticated employee attendance history',
  })
  getMyAttendance(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMyAttendanceQueryDto,
  ) {
    return this.attendanceService.getMyAttendance(req.user.sub, query);
  }

  @Get()
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({
    summary: 'List attendance records with optional filters (admin)',
  })
  findAll(@Query() query: GetAttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Patch(':id')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Correct an attendance record' })
  correctAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectAttendanceDto,
  ) {
    return this.attendanceService.correctAttendance(id, dto);
  }
}
