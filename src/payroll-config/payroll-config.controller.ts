import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PayrollConfigService } from './payroll-config.service';
import { CreatePayrollStructureDto } from './dto/create-payroll-structure.dto';
import { UpdatePayrollStructureDto } from './dto/update-payroll-structure.dto';
import { CreatePayrollHeadDto } from './dto/create-payroll-head.dto';
import { UpdateStructureHeadDto } from './dto/update-structure-head.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/utils/decorators/permissions.decorator';
import { AddStructureHeadDto } from './dto/add-structure-head.dto';

@ApiTags('Payroll Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PayrollConfigController {
  constructor(private readonly payrollConfigService: PayrollConfigService) {}

  // ---------- PAYROLL STRUCTURES ----------

  @Get('payroll-structures')
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Get all payroll structures' })
  findAllStructures() {
    return this.payrollConfigService.findAllStructures();
  }

  @Get('payroll-structures/:id')
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Get a payroll structure and its heads' })
  findStructureById(@Param('id', ParseIntPipe) id: number) {
    return this.payrollConfigService.findStructureById(id);
  }

  @Post('payroll-structures')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a payroll structure' })
  createStructure(@Body() dto: CreatePayrollStructureDto) {
    return this.payrollConfigService.createStructure(dto);
  }

  @Patch('payroll-structures/:id')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a payroll structure' })
  updateStructure(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePayrollStructureDto,
  ) {
    return this.payrollConfigService.updateStructure(id, dto);
  }

  @Delete('payroll-structures/:id')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete an unassigned payroll structure' })
  deleteStructure(@Param('id', ParseIntPipe) id: number) {
    return this.payrollConfigService.deleteStructure(id);
  }

  // ---------- PAYROLL HEADS ----------

  @Get('payroll-heads')
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Get all payroll heads' })
  findAllHeads() {
    return this.payrollConfigService.findAllHeads();
  }

  @Post('payroll-heads')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create a payroll head' })
  createHead(@Body() dto: CreatePayrollHeadDto) {
    return this.payrollConfigService.createHead(dto);
  }

  @Delete('payroll-heads/:id')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete a payroll head not used by any structure' })
  deleteHead(@Param('id', ParseIntPipe) id: number) {
    return this.payrollConfigService.deleteHead(id);
  }

  // ---------- STRUCTURE HEADS ----------

  @Post('payroll-structures/:id/heads/:headId')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add a payroll head to a structure' })
  addHeadToStructure(
    @Param('id', ParseIntPipe) structureId: number,
    @Param('headId', ParseIntPipe) headId: number,
    @Body() body: AddStructureHeadDto,
  ) {
    return this.payrollConfigService.addHeadToStructure(
      structureId,
      headId,
      body.value,
    );
  }

  @Patch('payroll-structures/:id/heads/:headId')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a payroll head value in a structure' })
  updateStructureHead(
    @Param('id', ParseIntPipe) structureId: number,
    @Param('headId', ParseIntPipe) headId: number,
    @Body() dto: UpdateStructureHeadDto,
  ) {
    return this.payrollConfigService.updateStructureHead(
      structureId,
      headId,
      dto,
    );
  }

  @Delete('payroll-structures/:id/heads/:headId')
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Remove a payroll head from a structure' })
  removeHeadFromStructure(
    @Param('id', ParseIntPipe) structureId: number,
    @Param('headId', ParseIntPipe) headId: number,
  ) {
    return this.payrollConfigService.removeHeadFromStructure(
      structureId,
      headId,
    );
  }
}
