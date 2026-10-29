import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateEmployeeDto {
  @ApiProperty({
    description: 'Full name of the employee',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({
    description: 'Phone number of the employee',
    required: false,
    maxLength: 30,
    example: '01700000000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiProperty({
    description: 'Designation of the employee',
    required: false,
    maxLength: 100,
    example: 'Manager',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  designation?: string | null;

  @ApiProperty({
    description: 'Department ID of the employee',
    required: false,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId?: number | null;

  @ApiProperty({
    description: 'Join date of the employee',
    required: false,
    example: '2023-01-01',
  })
  @IsOptional()
  @IsDateString()
  joinDate?: string | null;

  @ApiProperty({
    description: 'Structure ID of the employee',
    required: false,
    minLength: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  structureId?: number | null;
}
