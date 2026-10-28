import { IsNumber, Min } from 'class-validator';

export class UpdateStructureHeadDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;
}
