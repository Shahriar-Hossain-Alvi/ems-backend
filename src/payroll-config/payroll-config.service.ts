import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CalcType, HeadType, Prisma } from '../generated/prisma/client';

import { CreatePayrollStructureDto } from './dto/create-payroll-structure.dto';
import { UpdatePayrollStructureDto } from './dto/update-payroll-structure.dto';
import { CreatePayrollHeadDto } from './dto/create-payroll-head.dto';
import { UpdateStructureHeadDto } from './dto/update-structure-head.dto';

@Injectable()
export class PayrollConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- PAYROLL STRUCTURES ----------

  async findAllStructures() {
    return this.prisma.payrollStructure.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            employees: true,
            heads: true,
          },
        },
      },
    });
  }

  async findStructureById(id: number) {
    const structure = await this.prisma.payrollStructure.findUnique({
      where: { id },
      include: {
        heads: {
          include: { head: true },
          orderBy: { id: 'asc' },
        },
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!structure) {
      throw new NotFoundException('Payroll structure not found');
    }

    return structure;
  }

  async createStructure(dto: CreatePayrollStructureDto) {
    try {
      return await this.prisma.payrollStructure.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim(),
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A payroll structure with this name already exists',
        );
      }
      throw error;
    }
  }

  async updateStructure(id: number, dto: UpdatePayrollStructureDto) {
    await this.ensureStructureExists(id);

    const data: Prisma.PayrollStructureUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }

    try {
      return await this.prisma.payrollStructure.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A payroll structure with this name already exists',
        );
      }
      throw error;
    }
  }

  async deleteStructure(id: number) {
    await this.ensureStructureExists(id);

    const employeeCount = await this.prisma.employee.count({
      where: { structureId: id },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        'Cannot delete a payroll structure assigned to employees',
      );
    }

    await this.prisma.$transaction([
      this.prisma.structureHead.deleteMany({
        where: { structureId: id },
      }),
      this.prisma.payrollStructure.delete({
        where: { id },
      }),
    ]);

    return { message: 'Payroll structure deleted successfully' };
  }

  // ---------- PAYROLL HEADS ----------

  async findAllHeads() {
    return this.prisma.payrollHead.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { structures: true },
        },
      },
    });
  }

  async createHead(dto: CreatePayrollHeadDto) {
    this.validateHeadConfiguration(dto);

    try {
      return await this.prisma.payrollHead.create({
        data: {
          name: dto.name.trim(),
          type: dto.type,
          calcType: dto.calcType,
          unitSource: dto.unitSource,
          isBasic: dto.isBasic ?? false,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A payroll head with this name already exists',
        );
      }
      throw error;
    }
  }

  async deleteHead(id: number) {
    const head = await this.prisma.payrollHead.findUnique({
      where: { id },
      include: {
        _count: {
          select: { structures: true },
        },
      },
    });

    if (!head) {
      throw new NotFoundException('Payroll head not found');
    }

    if (head._count.structures > 0) {
      throw new BadRequestException(
        'Remove this head from all payroll structures before deleting it',
      );
    }

    await this.prisma.payrollHead.delete({ where: { id } });

    return { message: 'Payroll head deleted successfully' };
  }

  // ---------- STRUCTURE HEADS ----------

  async addHeadToStructure(structureId: number, headId: number, value: number) {
    await this.ensureStructureExists(structureId);

    const head = await this.prisma.payrollHead.findUnique({
      where: { id: headId },
    });

    if (!head) {
      throw new NotFoundException('Payroll head not found');
    }

    if (value < 0 || !Number.isFinite(value)) {
      throw new BadRequestException(
        'Value must be a valid non-negative number',
      );
    }

    try {
      return await this.prisma.structureHead.create({
        data: {
          structureId,
          headId,
          value: new Prisma.Decimal(value),
        },
        include: { head: true },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'This payroll head is already assigned to the structure',
        );
      }
      throw error;
    }
  }

  async updateStructureHead(
    structureId: number,
    headId: number,
    dto: UpdateStructureHeadDto,
  ) {
    const structureHead = await this.prisma.structureHead.findUnique({
      where: {
        structureId_headId: { structureId, headId },
      },
    });

    if (!structureHead) {
      throw new NotFoundException(
        'Payroll head is not assigned to this structure',
      );
    }

    return this.prisma.structureHead.update({
      where: {
        structureId_headId: { structureId, headId },
      },
      data: { value: new Prisma.Decimal(dto.value) },
      include: { head: true },
    });
  }

  async removeHeadFromStructure(structureId: number, headId: number) {
    const structureHead = await this.prisma.structureHead.findUnique({
      where: {
        structureId_headId: { structureId, headId },
      },
    });

    if (!structureHead) {
      throw new NotFoundException(
        'Payroll head is not assigned to this structure',
      );
    }

    await this.prisma.structureHead.delete({
      where: {
        structureId_headId: { structureId, headId },
      },
    });

    return { message: 'Payroll head removed from structure' };
  }

  // ---------- HELPERS ----------

  private async ensureStructureExists(id: number) {
    const structure = await this.prisma.payrollStructure.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!structure) {
      throw new NotFoundException('Payroll structure not found');
    }

    return structure;
  }

  private validateHeadConfiguration(dto: CreatePayrollHeadDto) {
    if (dto.calcType === CalcType.PER_UNIT && !dto.unitSource) {
      throw new BadRequestException(
        'unitSource is required for PER_UNIT calculation',
      );
    }

    if (dto.calcType !== CalcType.PER_UNIT && dto.unitSource !== undefined) {
      throw new BadRequestException(
        'unitSource is only valid for PER_UNIT calculation',
      );
    }

    if (dto.isBasic && dto.type !== HeadType.EARNING) {
      throw new BadRequestException('A basic salary head must be an EARNING');
    }

    if (dto.isBasic && dto.calcType !== CalcType.FIXED) {
      throw new BadRequestException(
        'A basic salary head must use FIXED calculation',
      );
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
