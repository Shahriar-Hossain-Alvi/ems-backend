import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PayrollService } from './payroll.service';
import { PayrollPeriodDto } from './dto/payroll-period.dto';
import { GetMyPayslipsQueryDto } from './dto/get-my-payslips-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/utils/decorators/permissions.decorator';

type AuthenticatedRequest = {
  user: {
    sub: number;
    role: string;
  };
};

@ApiTags('Payroll & Payslips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payslips')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Preview payroll for a month' })
  preview(@Query() dto: PayrollPeriodDto) {
    return this.payrollService.preview(dto);
  }

  @Post('generate')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Generate draft payslips for a month' })
  generate(@Body() dto: PayrollPeriodDto) {
    return this.payrollService.generate(dto);
  }

  @Post('publish')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Publish draft payslips for a month' })
  publish(@Body() dto: PayrollPeriodDto) {
    return this.payrollService.publish(dto);
  }

  // Keep this static route before @Get(':id').
  @Get('me')
  @Permissions('EMPLOYEE')
  @ApiOperation({ summary: 'Get the current employee’s published payslips' })
  findMyPayslips(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetMyPayslipsQueryDto,
  ) {
    return this.payrollService.findMyPayslips(req.user.sub, query);
  }

  @Get(':id')
  @Permissions('EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Get a payslip by ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.payrollService.findOne(id, req.user.sub, req.user.role);
  }
}
