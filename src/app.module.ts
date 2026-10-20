import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DepartmentsModule } from './departments/departments.module';
import { PayrollModule } from './payroll/payroll.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    DepartmentsModule,
    PayrollModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
