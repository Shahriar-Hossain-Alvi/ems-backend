import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CalcType, HeadType, UnitSource } from '../../generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayrollHeadDto {
  @ApiProperty({ example: 'Basic Salary' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: HeadType, example: HeadType.EARNING })
  @IsEnum(HeadType)
  type!: HeadType;

  @ApiProperty({ enum: CalcType, example: CalcType.FIXED })
  @IsEnum(CalcType)
  calcType!: CalcType;

  @ApiPropertyOptional({
    enum: UnitSource,
    example: UnitSource.LATE_DAYS,
    description: 'Required only when calcType is PER_UNIT.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UnitSource)
  unitSource?: UnitSource;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isBasic?: boolean;
}
