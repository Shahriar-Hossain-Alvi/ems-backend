import { PrismaService } from '../prisma/prisma.service';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeStatusDto } from './dto/update-employee-status.dto';
import { AccountStatus } from '../generated/prisma/enums';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetEmployeesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const where = {
      ...(query.departmentId !== undefined && {
        departmentId: query.departmentId,
      }),
      ...(query.status && {
        user: {
          is: {
            status: query.status,
          },
        },
      }),

      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { empCode: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
          {
            designation: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            user: {
              is: {
                email: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ],
      }),
    };

    const [employees, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          empCode: true,
          fullName: true,
          phone: true,
          designation: true,
          joinDate: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          structure: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      }),

      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        empCode: true,
        fullName: true,
        phone: true,
        designation: true,
        joinDate: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        structure: {
          select: {
            id: true,
            name: true,
            description: true,
            heads: {
              select: {
                id: true,
                value: true,
                head: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    calcType: true,
                    unitSource: true,
                    isBasic: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} was not found.`);
    }

    return employee;
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} was not found.`);
    }

    if (dto.departmentId != null) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        select: { id: true },
      });

      if (!department) {
        throw new NotFoundException(
          `Department with ID ${dto.departmentId} was not found.`,
        );
      }
    }

    if (dto.structureId != null) {
      const structure = await this.prisma.payrollStructure.findUnique({
        where: { id: dto.structureId },
        select: { id: true },
      });

      if (!structure) {
        throw new NotFoundException(
          `Payroll structure with ID ${dto.structureId} was not found.`,
        );
      }
    }

    const data = {
      ...(dto.fullName !== undefined && { fullName: dto.fullName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.designation !== undefined && {
        designation: dto.designation,
      }),
      ...(dto.departmentId !== undefined && {
        departmentId: dto.departmentId,
      }),
      ...(dto.joinDate !== undefined && {
        joinDate: dto.joinDate === null ? null : new Date(dto.joinDate),
      }),
      ...(dto.structureId !== undefined && {
        structureId: dto.structureId,
      }),
    };

    try {
      return await this.prisma.employee.update({
        where: { id },
        data,
        select: {
          id: true,
          empCode: true,
          fullName: true,
          phone: true,
          designation: true,
          joinDate: true,
          department: {
            select: { id: true, name: true },
          },
          structure: {
            select: { id: true, name: true },
          },
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException(
          'An employee with this information already exists.',
        );
      }

      throw error;
    }
  }

  async updateStatus(id: number, dto: UpdateEmployeeStatusDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        empCode: true,
        user: {
          select: {
            id: true,
            status: true,
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} was not found.`);
    }

    const currentStatus = employee.user.status;
    const nextStatus = dto.status;

    const allowedTransitions: Record<AccountStatus, AccountStatus[]> = {
      [AccountStatus.PENDING]: [AccountStatus.ACTIVE, AccountStatus.REJECTED],
      [AccountStatus.ACTIVE]: [AccountStatus.INACTIVE],
      [AccountStatus.INACTIVE]: [AccountStatus.ACTIVE],
      [AccountStatus.REJECTED]: [],
    };

    if (!allowedTransitions[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change employee status from ${currentStatus} to ${nextStatus}.`,
      );
    }

    const empCode =
      nextStatus === AccountStatus.ACTIVE &&
      currentStatus === AccountStatus.PENDING
        ? `EMP-${String(employee.id).padStart(5, '0')}`
        : employee.empCode;

    return this.prisma.$transaction(async (tx) => {
      const updatedEmployee = await tx.employee.update({
        where: { id },
        data: { empCode },
        select: {
          id: true,
          empCode: true,
          fullName: true,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: employee.user.id },
        data: { status: nextStatus },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      return {
        message: `Employee status changed to ${nextStatus}.`,
        employee: {
          ...updatedEmployee,
          user: updatedUser,
        },
      };
    });
  }
}
