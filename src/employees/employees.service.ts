import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';

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
}
