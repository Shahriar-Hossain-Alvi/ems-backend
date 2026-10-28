import { IsEnum } from 'class-validator';
import { AccountStatus } from '../../generated/prisma/enums';

export class UpdateEmployeeStatusDto {
  @IsEnum(AccountStatus)
  status!: AccountStatus;
}
