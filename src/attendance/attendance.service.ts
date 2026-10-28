import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetMyAttendanceQueryDto } from './dto/get-my-attendance-query.dto';
import { GetAttendanceQueryDto } from './dto/get-attendance-query.dto';

const DEFAULT_POLICY = {
  id: 1,
  shiftStart: '09:00',
  shiftEnd: '18:00',
  graceMinutes: 15,
  breakMinutes: 60,
  standardHours: 8,
  workingDays: 22,
};

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private getDhakaParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour: Number(values.hour),
      minute: Number(values.minute),
      second: Number(values.second),
    };
  }

  private getDhakaDateString(date = new Date()): string {
    const parts = this.getDhakaParts(date);

    return [
      parts.year,
      String(parts.month).padStart(2, '0'),
      String(parts.day).padStart(2, '0'),
    ].join('-');
  }

  private dateAtUtcMidnight(dateString: string): Date {
    return new Date(`${dateString}T00:00:00.000Z`);
  }

  private getMonthRange(year: number, month: number) {
    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 1)),
    };
  }

  private getYearRange(year: number) {
    return {
      start: new Date(Date.UTC(year, 0, 1)),
      end: new Date(Date.UTC(year + 1, 0, 1)),
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async getPolicy() {
    const policy = await this.prisma.workPolicy.findUnique({
      where: { id: 1 },
    });

    return policy ?? DEFAULT_POLICY;
  }

  private async getEmployeeForUser(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: {
        id: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile was not found.');
    }

    if (employee.user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Your account must be active to use attendance features.',
      );
    }

    return employee;
  }

  async getToday(userId: number) {
    const employee = await this.getEmployeeForUser(userId);
    const policy = await this.getPolicy();

    const workDate = this.dateAtUtcMidnight(this.getDhakaDateString());

    const record = await this.prisma.attendance.findUnique({
      where: {
        employeeId_workDate: {
          employeeId: employee.id,
          workDate,
        },
      },
    });

    let state: 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT';

    if (!record) {
      state = 'NOT_CLOCKED_IN';
    } else if (record.clockOut) {
      state = 'CLOCKED_OUT';
    } else {
      state = 'CLOCKED_IN';
    }

    return {
      state,
      record,
      policy: {
        shiftStart: policy.shiftStart,
        shiftEnd: policy.shiftEnd,
        graceMinutes: policy.graceMinutes,
        breakMinutes: policy.breakMinutes,
        standardHours: policy.standardHours,
      },
    };
  }

  async clockIn(userId: number) {
    const employee = await this.getEmployeeForUser(userId);
    const policy = await this.getPolicy();

    const now = new Date();
    const localParts = this.getDhakaParts(now);
    const localMinutes = localParts.hour * 60 + localParts.minute;

    const workDate = this.dateAtUtcMidnight(this.getDhakaDateString(now));

    const shiftStartMinutes = this.timeToMinutes(policy.shiftStart);
    const isLate = localMinutes > shiftStartMinutes + policy.graceMinutes;

    try {
      const record = await this.prisma.attendance.create({
        data: {
          employeeId: employee.id,
          workDate,
          clockIn: now,
          isLate,
          workMinutes: 0,
          overtimeMinutes: 0,
        },
      });

      return {
        message: 'Clock-in recorded successfully.',
        record,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('You have already clocked in for today.');
      }

      throw error;
    }
  }

  async clockOut(userId: number) {
    const employee = await this.getEmployeeForUser(userId);
    const policy = await this.getPolicy();

    const workDate = this.dateAtUtcMidnight(this.getDhakaDateString());

    const record = await this.prisma.attendance.findUnique({
      where: {
        employeeId_workDate: {
          employeeId: employee.id,
          workDate,
        },
      },
    });

    if (!record) {
      throw new BadRequestException('You must clock in before clocking out.');
    }

    if (record.clockOut) {
      throw new ConflictException('You have already clocked out for today.');
    }

    const now = new Date();

    if (now.getTime() < record.clockIn.getTime()) {
      throw new BadRequestException(
        'Clock-out time cannot be earlier than clock-in time.',
      );
    }

    const elapsedMinutes = Math.floor(
      (now.getTime() - record.clockIn.getTime()) / 60000,
    );

    const workMinutes = Math.max(0, elapsedMinutes - policy.breakMinutes);

    const standardMinutes = policy.standardHours * 60;

    const overtimeMinutes = Math.max(0, workMinutes - standardMinutes);

    // Update only if another request hasn't already clocked out.
    const updateResult = await this.prisma.attendance.updateMany({
      where: {
        id: record.id,
        clockOut: null,
      },
      data: {
        clockOut: now,
        workMinutes,
        overtimeMinutes,
      },
    });

    if (updateResult.count === 0) {
      throw new ConflictException(
        'This attendance record has already been clocked out.',
      );
    }

    const updatedRecord = await this.prisma.attendance.findUnique({
      where: { id: record.id },
    });

    return {
      message: 'Clock-out recorded successfully.',
      record: updatedRecord,
      summary: {
        elapsedMinutes,
        workMinutes,
        overtimeMinutes,
      },
    };
  }

  async getMyAttendance(userId: number, query: GetMyAttendanceQueryDto) {
    const employee = await this.getEmployeeForUser(userId);

    const currentDate = this.getDhakaParts();
    const year = query.year ?? currentDate.year;
    const month = query.month ?? currentDate.month;

    const { start, end } = this.getMonthRange(year, month);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      employeeId: employee.id,
      workDate: {
        gte: start,
        lt: end,
      },
    };

    const [data, total, aggregate, lateCount] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        orderBy: { workDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.attendance.count({ where }),

      this.prisma.attendance.aggregate({
        where,
        _sum: {
          workMinutes: true,
          overtimeMinutes: true,
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.attendance.count({
        where: {
          ...where,
          isLate: true,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        year,
        month,
        attendanceDays: aggregate._count._all,
        lateDays: lateCount,
        totalWorkMinutes: aggregate._sum.workMinutes ?? 0,
        totalOvertimeMinutes: aggregate._sum.overtimeMinutes ?? 0,
      },
    };
  }

  async findAll(query: GetAttendanceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let dateRange:
      | {
          gte: Date;
          lt: Date;
        }
      | undefined;

    if (query.date) {
      const start = this.dateAtUtcMidnight(query.date);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      dateRange = { gte: start, lt: end };
    } else if (query.month !== undefined) {
      const currentYear = this.getDhakaParts().year;
      const { start, end } = this.getMonthRange(
        query.year ?? currentYear,
        query.month,
      );

      dateRange = { gte: start, lt: end };
    } else if (query.year !== undefined) {
      const { start, end } = this.getYearRange(query.year);
      dateRange = { gte: start, lt: end };
    }

    const employeeFilter = {
      ...(query.employeeId !== undefined && {
        id: query.employeeId,
      }),
      ...(query.departmentId !== undefined && {
        departmentId: query.departmentId,
      }),
    };

    const where = {
      ...(dateRange && { workDate: dateRange }),
      ...(query.isLate !== undefined && {
        isLate: query.isLate,
      }),
      ...(Object.keys(employeeFilter).length > 0 && {
        employee: {
          is: employeeFilter,
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ workDate: 'desc' }, { clockIn: 'desc' }],
        select: {
          id: true,
          workDate: true,
          clockIn: true,
          clockOut: true,
          workMinutes: true,
          overtimeMinutes: true,
          isLate: true,
          employee: {
            select: {
              id: true,
              empCode: true,
              fullName: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              user: {
                select: {
                  email: true,
                  status: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
