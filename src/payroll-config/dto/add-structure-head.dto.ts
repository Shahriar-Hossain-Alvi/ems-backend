import { IsNumber, Min } from 'class-validator';

export class AddStructureHeadDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;
}
