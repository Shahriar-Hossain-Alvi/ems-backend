import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({
    required: true,
  })
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @ApiProperty({
    required: true,
    minLength: 8,
    maxLength: 72,
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @ApiProperty({
    required: true,
    minLength: 2,
    maxLength: 100,
  })
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(14)
  @ApiProperty({
    required: false,
    maxLength: 14,
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    required: false,
    maxLength: 100,
  })
  designation?: string;
}
