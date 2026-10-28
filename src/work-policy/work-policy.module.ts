import { Module } from '@nestjs/common';
import { WorkPolicyService } from './work-policy.service';
import { WorkPolicyController } from './work-policy.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WorkPolicyController],
  providers: [WorkPolicyService],
  exports: [WorkPolicyService],
})
export class WorkPolicyModule {}
