import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkPolicyDto } from './dto/update-work-policy.dto';

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
export class WorkPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    return this.prisma.workPolicy.upsert({
      where: { id: 1 },
      update: {},
      create: DEFAULT_POLICY,
    });
  }

  async update(dto: UpdateWorkPolicyDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'Provide at least one work policy field to update',
      );
    }

    const currentPolicy = await this.findOne();

    const shiftStart = dto.shiftStart ?? currentPolicy.shiftStart;
    const shiftEnd = dto.shiftEnd ?? currentPolicy.shiftEnd;

    if (this.timeToMinutes(shiftEnd) <= this.timeToMinutes(shiftStart)) {
      throw new BadRequestException('shiftEnd must be later than shiftStart');
    }

    const standardHours = dto.standardHours ?? currentPolicy.standardHours;
    const breakMinutes = dto.breakMinutes ?? currentPolicy.breakMinutes;

    if (standardHours * 60 <= breakMinutes) {
      throw new BadRequestException(
        'The standard work duration must be greater than the break duration',
      );
    }

    return this.prisma.workPolicy.update({
      where: { id: 1 },
      data: dto,
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
