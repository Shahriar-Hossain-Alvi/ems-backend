import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DepartmentsModule } from './departments/departments.module';
import { PayrollModule } from './payroll/payroll.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { WorkPolicyModule } from './work-policy/work-policy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    EmployeesModule,
    AttendanceModule,
    DepartmentsModule,
    PayrollModule,
    PrismaModule,
    WorkPolicyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
