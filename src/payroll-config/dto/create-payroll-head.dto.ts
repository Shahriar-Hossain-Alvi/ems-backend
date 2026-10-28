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

export class CreatePayrollHeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(HeadType)
  type!: HeadType;

  @IsEnum(CalcType)
  calcType!: CalcType;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(UnitSource)
  unitSource?: UnitSource;

  @IsOptional()
  @IsBoolean()
  isBasic?: boolean;
}
