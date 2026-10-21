import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
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
}
