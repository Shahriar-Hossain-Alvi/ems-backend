import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class PayrollPeriodDto {
  @ApiProperty({
    example: 10,
    description: 'Payroll month (January = 1, December = 12)',
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({
    example: 2026,
    description: 'Four-digit payroll year',
    minimum: 2000,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;
}
