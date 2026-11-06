import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus, Role } from '../../generated/prisma/client';

class DepartmentResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Sales' })
  name!: string;
}

class StructureResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Sales' })
  name!: string;

  @ApiProperty({ example: 'Sales' })
  description!: string | null;
}

class EmployeeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiPropertyOptional({ example: 'EMP-00001', nullable: true })
  empCode!: string | null;

  @ApiPropertyOptional({ example: 'John Doe', nullable: true })
  fullName!: string | null;

  @ApiPropertyOptional({ example: '01712345678', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: 'Software Engineer', nullable: true })
  designation!: string | null;

  @ApiPropertyOptional({
    example: '2022-01-01T00:00:00.000Z',
    nullable: true,
    type: Date,
  })
  joinDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  department!: DepartmentResponseDto | null;

  @ApiPropertyOptional({ nullable: true })
  structure!: StructureResponseDto | null;
}

export class GetMeResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'b5cY9@example.com' })
  email!: string;

  @ApiProperty({ enum: Role, example: Role.EMPLOYEE })
  role!: Role;

  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE })
  status!: AccountStatus;

  @ApiProperty({
    example: '2022-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt!: Date;

  @ApiProperty({
    type: () => EmployeeResponseDto,
    nullable: true,
  })
  employee!: EmployeeResponseDto | null;
}
