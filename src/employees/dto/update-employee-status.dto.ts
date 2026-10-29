import { IsEnum } from 'class-validator';
import { AccountStatus } from '../../generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmployeeStatusDto {
  @ApiProperty({
    description: 'New status for the employee',
    enum: AccountStatus,
    examples: {
      ACTIVE: {
        summary: 'Active status',
        value: AccountStatus.ACTIVE,
      },
      INACTIVE: {
        summary: 'Inactive status',
        value: AccountStatus.INACTIVE,
      },
      PENDING: {
        summary: 'Pending status',
        value: AccountStatus.PENDING,
      },
      REJECTED: {
        summary: 'Rejected status',
        value: AccountStatus.REJECTED,
      },
    },
  })
  @IsEnum(AccountStatus)
  status!: AccountStatus;
}
