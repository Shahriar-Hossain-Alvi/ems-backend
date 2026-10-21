import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/common/utils/password.util';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing from .env');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function seedAccount(
  emailEnv: string,
  passwordEnv: string,
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DEMO_ADMIN',
) {
  const email = requiredEnv(emailEnv).trim().toLowerCase();
  const password = requiredEnv(passwordEnv);
  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      status: 'APPROVED',
    },
    create: {
      email,
      passwordHash,
      role,
      status: 'APPROVED',
    },
  });

  console.log(`Seeded ${role}: ${email}`);
}

async function main() {
  await seedAccount('SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD', 'SUPER_ADMIN');

  await seedAccount('ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN');

  await seedAccount('DEMO_ADMIN_EMAIL', 'DEMO_ADMIN_PASSWORD', 'DEMO_ADMIN');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
