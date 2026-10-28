import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { EmployeesService } from './employees.service';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/utils/decorators/permissions.decorator';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({
    summary: 'List employees with pagination and optional filters',
  })
  findAll(@Query() query: GetEmployeesQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee details by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update employee details (admin only)' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Approve, reject, deactivate or reactivate an employee',
  })
  @ApiParam({ name: 'id', type: Number })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeStatusDto,
  ) {
    return this.employeesService.updateStatus(id, dto);
  }
}
