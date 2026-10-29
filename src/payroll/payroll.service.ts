import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccountStatus,
  CalcType,
  HeadType,
  PayslipStatus,
  Prisma,
  UnitSource,
} from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PayrollPeriodDto } from './dto/payroll-period.dto';
import { GetMyPayslipsQueryDto } from './dto/get-my-payslips-query.dto';

type PayrollItemCalculation = {
  headName: string;
  type: HeadType;
  amount: number;
  note: string | null;
};

type PayrollCalculation = {
  employeeId: number;
  empCode: string | null;
  fullName: string;
  status: 'READY' | 'NO_STRUCTURE' | 'NO_BASIC_HEAD';
  message?: string;
  daysPresent: number;
  lateDays: number;
  workingDays: number;
  overtimeHours: number;
  gross: number;
  deductions: number;
  netPay: number;
  items: PayrollItemCalculation[];
};

type PayrollAttendanceRecord = {
  clockIn: Date | null;
  isLate: boolean;
  overtimeMinutes: number;
};

type PayrollStructureEntry = {
  value: Prisma.Decimal;
  head: {
    name: string;
    type: HeadType;
    calcType: CalcType;
    unitSource: UnitSource | null;
    isBasic: boolean;
  };
};

type EmployeePayrollInput = {
  id: number;
  empCode: string | null;
  fullName: string;
  payrollWorkingDays: number;
  attendance: PayrollAttendanceRecord[];
  structure: {
    heads: PayrollStructureEntry[];
  } | null;
};

type PayrollEmployee = Prisma.EmployeeGetPayload<{
  include: {
    structure: {
      include: {
        heads: {
          include: {
            head: true;
          };
        };
      };
    };
    attendance: {
      select: {
        clockIn: true;
        isLate: true;
        overtimeMinutes: true;
      };
    };
  };
}> & {
  payrollWorkingDays: number;
};

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- PAYROLL PREVIEW ----------

  async preview(dto: PayrollPeriodDto) {
    this.validatePeriod(dto);

    const employees = await this.getActiveEmployeesForPeriod(dto);
    const existingPayslips = await this.prisma.payslip.findMany({
      where: { month: dto.month, year: dto.year },
      select: {
        employeeId: true,
        status: true,
      },
    });

    const existingByEmployee = new Map(
      existingPayslips.map((payslip) => [payslip.employeeId, payslip.status]),
    );

    const results = employees.map((employee) => {
      const calculation = this.calculateEmployeePayroll(employee);

      const existingStatus = existingByEmployee.get(employee.id);

      if (existingStatus === PayslipStatus.PUBLISHED) {
        return {
          ...calculation,
          status: 'ALREADY_PUBLISHED' as const,
          message: 'This employee already has a published payslip.',
        };
      }

      return calculation;
    });

    return {
      month: dto.month,
      year: dto.year,
      totalEmployees: results.length,
      ready: results.filter((item) => item.status === 'READY').length,
      issues: results.filter((item) => item.status !== 'READY').length,
      employees: results,
    };
  }

  // ---------- GENERATE DRAFT PAYSLIPS ----------

  async generate(dto: PayrollPeriodDto) {
    this.validatePeriod(dto);

    const employees = await this.getActiveEmployeesForPeriod(dto);

    const existingPayslips = await this.prisma.payslip.findMany({
      where: { month: dto.month, year: dto.year },
      select: {
        id: true,
        employeeId: true,
        status: true,
      },
    });

    const existingByEmployee = new Map(
      existingPayslips.map((payslip) => [payslip.employeeId, payslip]),
    );

    const results: Array<{
      employeeId: number;
      empCode: string | null;
      fullName: string;
      result: string;
      message?: string;
      payslipId?: number;
    }> = [];

    for (const employee of employees) {
      const calculation = this.calculateEmployeePayroll(employee);
      const existing = existingByEmployee.get(employee.id);

      if (existing?.status === PayslipStatus.PUBLISHED) {
        results.push({
          employeeId: employee.id,
          empCode: employee.empCode,
          fullName: employee.fullName,
          result: 'ALREADY_PUBLISHED',
          message: 'Published payslips cannot be regenerated.',
          payslipId: existing.id,
        });
        continue;
      }

      if (calculation.status !== 'READY') {
        results.push({
          employeeId: employee.id,
          empCode: employee.empCode,
          fullName: employee.fullName,
          result: calculation.status,
          message: calculation.message,
        });
        continue;
      }

      const payslipData = {
        daysPresent: calculation.daysPresent,
        lateDays: calculation.lateDays,
        workingDays: calculation.workingDays,
        overtimeHours: new Prisma.Decimal(calculation.overtimeHours.toFixed(2)),
        gross: new Prisma.Decimal(calculation.gross.toFixed(2)),
        deductions: new Prisma.Decimal(calculation.deductions.toFixed(2)),
        netPay: new Prisma.Decimal(calculation.netPay.toFixed(2)),
      };

      const payslip = await this.prisma.$transaction(async (tx) => {
        if (existing) {
          return tx.payslip.update({
            where: { id: existing.id },
            data: {
              ...payslipData,
              generatedAt: new Date(),
              items: {
                deleteMany: {},
                create: calculation.items.map((item) => ({
                  headName: item.headName,
                  type: item.type,
                  amount: new Prisma.Decimal(item.amount.toFixed(2)),
                  note: item.note,
                })),
              },
            },
          });
        }

        return tx.payslip.create({
          data: {
            employeeId: employee.id,
            month: dto.month,
            year: dto.year,
            status: PayslipStatus.DRAFT,
            ...payslipData,
            items: {
              create: calculation.items.map((item) => ({
                headName: item.headName,
                type: item.type,
                amount: new Prisma.Decimal(item.amount.toFixed(2)),
                note: item.note,
              })),
            },
          },
        });
      });

      results.push({
        employeeId: employee.id,
        empCode: employee.empCode,
        fullName: employee.fullName,
        result: existing ? 'DRAFT_REGENERATED' : 'DRAFT_CREATED',
        payslipId: payslip.id,
      });
    }

    return {
      month: dto.month,
      year: dto.year,
      totalEmployees: results.length,
      created: results.filter((r) => r.result === 'DRAFT_CREATED').length,
      regenerated: results.filter((r) => r.result === 'DRAFT_REGENERATED')
        .length,
      skipped: results.filter(
        (r) => r.result !== 'DRAFT_CREATED' && r.result !== 'DRAFT_REGENERATED',
      ).length,
      results,
    };
  }

  // ---------- PUBLISH PAYSLIPS ----------

  async publish(dto: PayrollPeriodDto) {
    this.validatePeriod(dto);

    const result = await this.prisma.payslip.updateMany({
      where: {
        month: dto.month,
        year: dto.year,
        status: PayslipStatus.DRAFT,
      },
      data: {
        status: PayslipStatus.PUBLISHED,
      },
    });

    return {
      month: dto.month,
      year: dto.year,
      publishedCount: result.count,
      message:
        result.count > 0
          ? 'Draft payslips published successfully.'
          : 'No draft payslips were found for this period.',
    };
  }

  // ---------- EMPLOYEE PAYSLIP HISTORY ----------

  async findMyPayslips(userId: number, query: GetMyPayslipsQueryDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found.');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.PayslipWhereInput = {
      employeeId: employee.id,
      status: PayslipStatus.PUBLISHED,
      ...(query.month !== undefined ? { month: query.month } : {}),
      ...(query.year !== undefined ? { year: query.year } : {}),
    };

    const [total, payslips] = await this.prisma.$transaction([
      this.prisma.payslip.count({ where }),
      this.prisma.payslip.findMany({
        where,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: true,
        },
      }),
    ]);

    return {
      data: payslips,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ---------- SINGLE PAYSLIP ----------

  async findOne(payslipId: number, userId: number, role: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        items: true,
        employee: {
          select: {
            id: true,
            userId: true,
            empCode: true,
            fullName: true,
            department: {
              select: { name: true },
            },
            structure: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found.');
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'DEMO_ADMIN'].includes(role);

    if (!isAdmin && payslip.employee.userId !== userId) {
      throw new ForbiddenException('You can only view your own payslips.');
    }

    if (!isAdmin && payslip.status !== PayslipStatus.PUBLISHED) {
      throw new NotFoundException('Payslip not found.');
    }

    // const { userId: _userId, ...employeeDetails } = payslip.employee;

    return {
      ...payslip,
      employee: {
        id: payslip.employee.id,
        empCode: payslip.employee.empCode,
        fullName: payslip.employee.fullName,
        department: payslip.employee.department,
        structure: payslip.employee.structure,
      },
    };
  }

  // ---------- INTERNAL HELPERS ----------

  private validatePeriod(dto: PayrollPeriodDto) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());

    const currentYear = Number(
      parts.find((part) => part.type === 'year')?.value,
    );
    const currentMonth = Number(
      parts.find((part) => part.type === 'month')?.value,
    );

    if (
      dto.year > currentYear ||
      (dto.year === currentYear && dto.month > currentMonth)
    ) {
      throw new BadRequestException(
        'Payroll cannot be generated for a future month.',
      );
    }
  }

  private async getActiveEmployeesForPeriod(
    dto: PayrollPeriodDto,
  ): Promise<PayrollEmployee[]> {
    const start = new Date(Date.UTC(dto.year, dto.month - 1, 1));
    const end = new Date(Date.UTC(dto.year, dto.month, 1));

    const policy = await this.prisma.workPolicy.findUnique({
      where: { id: 1 },
      select: { workingDays: true },
    });

    const workingDays = policy?.workingDays ?? 22;

    const employees = await this.prisma.employee.findMany({
      where: {
        user: {
          status: AccountStatus.ACTIVE,
        },
      },
      orderBy: { id: 'asc' },
      include: {
        structure: {
          include: {
            heads: {
              include: {
                head: true,
              },
            },
          },
        },
        attendance: {
          where: {
            workDate: {
              gte: start,
              lt: end,
            },
          },
          select: {
            clockIn: true,
            isLate: true,
            overtimeMinutes: true,
          },
        },
      },
    });
    return employees.map((employee): PayrollEmployee => ({
      ...employee,
      payrollWorkingDays: workingDays,
    }));
  }

  private calculateEmployeePayroll(
    employee: PayrollEmployee,
  ): PayrollCalculation {
    const attendance = employee.attendance;
    const workingDays = employee.payrollWorkingDays;

    const daysPresent = attendance.filter(
      (record) => record.clockIn !== null,
    ).length;

    const lateDays = attendance.filter((record) => record.isLate).length;

    const overtimeMinutes = attendance.reduce(
      (total, record) => total + record.overtimeMinutes,
      0,
    );

    const overtimeHours = roundMoney(overtimeMinutes / 60);

    const base = {
      employeeId: employee.id,
      empCode: employee.empCode,
      fullName: employee.fullName,
      daysPresent,
      lateDays,
      workingDays,
      overtimeHours,
      gross: 0,
      deductions: 0,
      netPay: 0,
      items: [] as PayrollItemCalculation[],
    };

    if (!employee.structure) {
      return {
        ...base,
        status: 'NO_STRUCTURE',
        message: 'No payroll structure is assigned to this employee.',
      };
    }

    const structureHeads = employee.structure.heads;

    const basicStructureHead = structureHeads.find(
      (entry) =>
        entry.head.isBasic &&
        entry.head.type === HeadType.EARNING &&
        entry.head.calcType === CalcType.FIXED,
    );

    if (!basicStructureHead) {
      return {
        ...base,
        status: 'NO_BASIC_HEAD',
        message:
          'The assigned structure must contain a fixed EARNING head marked as basic salary.',
      };
    }

    const basicSalary = Number(basicStructureHead.value);
    const absentDays = Math.max(workingDays - daysPresent, 0);

    let gross = 0;
    let deductions = 0;

    const items: PayrollItemCalculation[] = [];

    for (const entry of structureHeads) {
      const head = entry.head;
      const value = Number(entry.value);

      let amount = 0;
      let note: string | null = null;

      switch (head.calcType) {
        case CalcType.FIXED:
          amount = value;
          break;

        case CalcType.PERCENT_OF_BASIC:
          amount = (basicSalary * value) / 100;
          note = `${value}% of basic salary`;
          break;

        case CalcType.PER_UNIT: {
          let units = 0;
          let unitLabel = 'units';

          switch (head.unitSource) {
            case UnitSource.OVERTIME_HOURS:
              units = overtimeHours;
              unitLabel = 'overtime hours';
              break;

            case UnitSource.LATE_DAYS:
              units = lateDays;
              unitLabel = 'late days';
              break;

            case UnitSource.ABSENT_DAYS:
              units = absentDays;
              unitLabel = 'absent days';
              break;
          }

          amount = value * units;
          note = `${value} × ${units} ${unitLabel}`;
          break;
        }
      }

      amount = roundMoney(amount);

      items.push({
        headName: head.name,
        type: head.type,
        amount,
        note,
      });

      if (head.type === HeadType.EARNING) {
        gross += amount;
      } else {
        deductions += amount;
      }
    }

    gross = roundMoney(gross);
    deductions = roundMoney(deductions);

    return {
      ...base,
      status: 'READY',
      gross,
      deductions,
      netPay: roundMoney(gross - deductions),
      items,
    };
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
