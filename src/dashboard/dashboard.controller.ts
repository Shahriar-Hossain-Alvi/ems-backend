import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/utils/decorators/permissions.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('employee')
  @Permissions('EMPLOYEE')
  @ApiOperation({ summary: 'Get employee dashboard summary' })
  getEmployeeDashboard(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getEmployeeDashboard(req.user.sub);
  }

  @Get('admin')
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Get admin dashboard summary' })
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}
