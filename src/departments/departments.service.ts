import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { GetDepartmentsQueryDto } from './dto/get-departments-query.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const name = dto.name.trim();

    try {
      return await this.prisma.department.create({
        data: { name },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      });
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'A department with this name already exists.',
        );
      }

      throw error;
    }
  }

  async findAll(query: GetDepartmentsQueryDto) {
    return this.prisma.department.findMany({
      where: query.search
        ? {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    return department;
  }

  async update(id: number, dto: UpdateDepartmentDto) {
    await this.findOne(id);

    if (dto.name === undefined) {
      throw new ConflictException('Provide at least one field to update.');
    }

    try {
      return await this.prisma.department.update({
        where: { id },
        data: { name: dto.name.trim() },
        include: {
          _count: {
            select: { employees: true },
          },
        },
      });
    } catch (error) {
      if (this.isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'A department with this name already exists.',
        );
      }

      throw error;
    }
  }

  async remove(id: number) {
    const department = await this.findOne(id);

    if (department._count.employees > 0) {
      throw new ConflictException(
        'Cannot delete a department that has employees assigned to it.',
      );
    }

    try {
      await this.prisma.department.delete({
        where: { id },
      });
    } catch (error) {
      // Protect against an employee being assigned between
      // the employee-count check and the deletion.
      if (this.isPrismaError(error, 'P2003')) {
        throw new ConflictException(
          'Cannot delete this department because it is referenced by other records.',
        );
      }

      throw error;
    }

    return {
      message: 'Department deleted successfully.',
    };
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === code
    );
  }
}
