import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateWorkPolicyDto {
  @ApiPropertyOptional({
    description: 'Shift start time in HH:mm format, e.g. 09:00',
    required: false,
    example: '09:00',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'shiftStart must use HH:mm format, e.g. 09:00',
  })
  shiftStart?: string;

  @ApiPropertyOptional({
    description: 'Shift end time in HH:mm format, e.g. 18:00',
    required: false,
    example: '18:00',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'shiftEnd must use HH:mm format, e.g. 18:00',
  })
  shiftEnd?: string;

  @ApiPropertyOptional({
    description: 'Grace minutes',
    required: false,
    example: 30,
    minimum: 0,
    maximum: 180,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(180)
  graceMinutes?: number;

  @ApiPropertyOptional({
    description: 'Break minutes',
    required: false,
    example: 30,
    minimum: 0,
    maximum: 240,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(240)
  breakMinutes?: number;

  @ApiPropertyOptional({
    description: 'Standard hours',
    required: false,
    example: 5,
    minimum: 1,
    maximum: 24,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(24)
  standardHours?: number;

  @ApiPropertyOptional({
    description: 'Working days',
    required: false,
    example: 20,
    minimum: 1,
    maximum: 31,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(31)
  workingDays?: number;
}
