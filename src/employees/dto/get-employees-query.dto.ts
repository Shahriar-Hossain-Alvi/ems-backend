import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AccountStatus } from '../../generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetEmployeesQueryDto {
  @ApiPropertyOptional({
    description:
      'Search term for employee fullname, empCode, phone, designation',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'ID of the department to filter employees by',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number;

  @ApiPropertyOptional({
    description: 'Status of the employees to filter by',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of employees to return per page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
