import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, PayslipStatus, Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getDhakaDateParts() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return {
      year: Number(get('year')),
      month: Number(get('month')),
      day: Number(get('day')),
    };
  }

  private getDateRanges() {
    const { year, month, day } = this.getDhakaDateParts();

    const today = new Date(Date.UTC(year, month - 1, day));
    const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonth = new Date(Date.UTC(year, month, 1));

    return {
      year,
      month,
      today,
      tomorrow,
      monthStart,
      nextMonth,
    };
  }

  async getEmployeeDashboard(userId: number) {
    const { year, month, today, monthStart, nextMonth } = this.getDateRanges();

    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: {
        id: true,
        empCode: true,
        fullName: true,
        designation: true,
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
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }

    const [todayAttendance, monthlyAttendance, recentPayslips] =
      await Promise.all([
        this.prisma.attendance.findUnique({
          where: {
            employeeId_workDate: {
              employeeId: employee.id,
              workDate: today,
            },
          },
          select: {
            id: true,
            workDate: true,
            clockIn: true,
            clockOut: true,
            workMinutes: true,
            overtimeMinutes: true,
            isLate: true,
          },
        }),

        this.prisma.attendance.aggregate({
          where: {
            employeeId: employee.id,
            workDate: {
              gte: monthStart,
              lt: nextMonth,
            },
          },
          _count: { id: true },
          _sum: {
            workMinutes: true,
            overtimeMinutes: true,
          },
        }),

        this.prisma.payslip.findMany({
          where: {
            employeeId: employee.id,
            status: PayslipStatus.PUBLISHED,
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 5,
          select: {
            id: true,
            month: true,
            year: true,
            gross: true,
            deductions: true,
            netPay: true,
            status: true,
            generatedAt: true,
          },
        }),
      ]);

    const lateDays = await this.prisma.attendance.count({
      where: {
        employeeId: employee.id,
        workDate: {
          gte: monthStart,
          lt: nextMonth,
        },
        isLate: true,
      },
    });

    return {
      employee,
      today: {
        date: today.toISOString().slice(0, 10),
        status: !todayAttendance
          ? 'NOT_CLOCKED_IN'
          : todayAttendance.clockOut
            ? 'CLOCKED_OUT'
            : 'CLOCKED_IN',
        attendance: todayAttendance,
      },
      monthlyAttendance: {
        year,
        month,
        daysPresent: monthlyAttendance._count.id,
        lateDays,
        totalWorkMinutes: monthlyAttendance._sum.workMinutes ?? 0,
        totalOvertimeMinutes: monthlyAttendance._sum.overtimeMinutes ?? 0,
      },
      recentPayslips,
    };
  }

  async getAdminDashboard() {
    const { year, month, today, tomorrow } = this.getDateRanges();

    const [
      totalEmployees,
      activeEmployees,
      pendingApprovals,
      rejectedAccounts,
      todayAttendanceCount,
      clockedOutCount,
      lateCount,
      currentMonthPayslips,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: Role.EMPLOYEE },
      }),

      this.prisma.user.count({
        where: {
          role: Role.EMPLOYEE,
          status: AccountStatus.ACTIVE,
        },
      }),

      this.prisma.user.count({
        where: {
          role: Role.EMPLOYEE,
          status: AccountStatus.PENDING,
        },
      }),

      this.prisma.user.count({
        where: {
          role: Role.EMPLOYEE,
          status: AccountStatus.REJECTED,
        },
      }),

      this.prisma.attendance.count({
        where: {
          workDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      this.prisma.attendance.count({
        where: {
          workDate: {
            gte: today,
            lt: tomorrow,
          },
          clockOut: { not: null },
        },
      }),

      this.prisma.attendance.count({
        where: {
          workDate: {
            gte: today,
            lt: tomorrow,
          },
          isLate: true,
        },
      }),

      this.prisma.payslip.count({
        where: {
          month,
          year,
          status: PayslipStatus.PUBLISHED,
        },
      }),
    ]);

    return {
      date: today.toISOString().slice(0, 10),
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        pendingApprovals,
        rejected: rejectedAccounts,
      },
      attendanceToday: {
        clockedIn: todayAttendanceCount,
        clockedOut: clockedOutCount,
        notClockedOut: todayAttendanceCount - clockedOutCount,
        late: lateCount,
      },
      payroll: {
        month,
        year,
        publishedPayslips: currentMonthPayslips,
      },
    };
  }
}
