import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import { UpdateWorkPolicyDto } from './dto/update-work-policy.dto';
import { WorkPolicyService } from './work-policy.service';
import { Permissions } from '../common/utils/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Work Policy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('work-policy')
export class WorkPolicyController {
  constructor(private readonly workPolicyService: WorkPolicyService) {}

  @Get()
  @Permissions('SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN')
  @ApiOperation({ summary: 'Get the current work policy' })
  findOne() {
    return this.workPolicyService.findOne();
  }

  @Patch()
  @Permissions('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update the work policy' })
  update(@Body() dto: UpdateWorkPolicyDto) {
    return this.workPolicyService.update(dto);
  }
}
