import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DepartmentsModule } from './departments/departments.module';
import { PayrollModule } from './payroll/payroll.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WorkPolicyModule } from './work-policy/work-policy.module';
import { PayrollConfigModule } from './payroll-config/payroll-config.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    // UsersModule,
    EmployeesModule,
    AttendanceModule,
    DepartmentsModule,
    PayrollModule,
    PrismaModule,
    WorkPolicyModule,
    PayrollConfigModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
