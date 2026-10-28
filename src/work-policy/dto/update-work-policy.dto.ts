import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateWorkPolicyDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'shiftStart must use HH:mm format, e.g. 09:00',
  })
  shiftStart?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'shiftEnd must use HH:mm format, e.g. 18:00',
  })
  shiftEnd?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(180)
  graceMinutes?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(240)
  breakMinutes?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(24)
  standardHours?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(31)
  workingDays?: number;
}
