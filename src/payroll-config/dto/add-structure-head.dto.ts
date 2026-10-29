import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class AddStructureHeadDto {
  @ApiProperty({
    description: 'The value of the head',
    example: 0.2,
    minimum: 0,
    required: true,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;
}
