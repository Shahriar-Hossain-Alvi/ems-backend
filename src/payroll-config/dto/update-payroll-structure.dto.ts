import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePayrollStructureDto {
  @ApiPropertyOptional({
    description: 'Name of the payroll structure',
    required: false,
    maxLength: 100,
    minLength: 1,
    example: 'Monthly',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the payroll structure',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
