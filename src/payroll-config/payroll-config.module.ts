import { Module } from '@nestjs/common';
import { PayrollConfigService } from './payroll-config.service';
import { PayrollConfigController } from './payroll-config.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PayrollConfigController],
  providers: [PayrollConfigService],
  exports: [PayrollConfigService],
})
export class PayrollConfigModule {}
