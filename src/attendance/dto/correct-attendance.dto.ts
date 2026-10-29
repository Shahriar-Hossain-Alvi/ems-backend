import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class CorrectAttendanceDto {
  @ApiPropertyOptional({
    example: '2026-10-29T03:05:00.000Z',
    description: 'Corrected clock-in time in ISO 8601 format',
  })
  @IsOptional()
  @IsDateString()
  clockIn?: string;

  @ApiPropertyOptional({
    example: '2026-10-29T12:10:00.000Z',
    description: 'Corrected clock-out time in ISO 8601 format',
  })
  @IsOptional()
  @IsDateString()
  clockOut?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Manually correct whether the employee was late',
  })
  @IsOptional()
  @IsBoolean()
  isLate?: boolean;
}
