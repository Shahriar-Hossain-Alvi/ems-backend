# Employee Management System Backend

This repository contains the backend API for an Employee Management System built with NestJS, Prisma, PostgreSQL, and JWT-based authentication.

It supports employee onboarding, department management, attendance tracking, payroll configuration, and role-based admin workflows.

## Tech Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Swagger/OpenAPI
- Class-validator / DTO validation

## Features

- User registration and login
- Role-based access control
- Employee profiles and department assignment
- Attendance management
- Payroll structures and payslip generation support
- Admin approval flow for new employee accounts
- API documentation via Swagger at `/docs`

## Project Structure

```bash
src/
├── app.module.ts
├── auth/
├── attendance/
├── common/
├── departments/
├── employees/
├── payroll/
├── prisma/
├── users/
├── main.ts
└── generated/
prisma/
├── schema.prisma
├── migrations/
├── seed.ts
└── ...
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 20+
- pnpm
- PostgreSQL installed and running
- A database user with permissions to create databases

## Environment Setup

Create a `.env` file in the project root and add the following values:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ems_dev"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="3d"

SUPER_ADMIN_EMAIL="superadmin@example.com"
SUPER_ADMIN_PASSWORD="superadminpassword"

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="adminpassword"

DEMO_ADMIN_EMAIL="demo@example.com"
DEMO_ADMIN_PASSWORD="demopassword"
```

Notes:
- `DATABASE_URL` should point to your PostgreSQL instance.
- The seeded admin accounts are created by the Prisma seed script.
- `JWT_SECRET` should be a strong random value in production.

## Quick Start

```bash
# Install dependencies
pnpm install

# Create the empty PostgreSQL database (if it doesn't exist)
node scripts/create-database.cjs

# Generate Prisma Client
pnpm exec prisma generate

# Run database migrations
pnpm exec prisma migrate dev --name init

# Seed default admin users
pnpm exec prisma db seed

# Start the app in development mode
pnpm run start:dev
```

The app runs by default on:

```bash
http://localhost:3000
```

Swagger UI is available at:

```bash
http://localhost:3000/docs
```

## Common Commands

```bash
# Start without watch mode
pnpm run start

# Start in watch mode
pnpm run start:dev

# Start in debug mode with watch
pnpm run start:debug

# Build the project
pnpm run build

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Lint the project
pnpm run lint

# Format code
pnpm run format
```

## Prisma Commands

```bash
# Create a new migration after changing schema.prisma
pnpm exec prisma migrate dev --name name-of-the-migration

# Regenerate Prisma Client
pnpm exec prisma generate

# Run the seed script
pnpm exec prisma db seed
```

## NestJS Resource Generation

```bash
# Generate a full resource (module, controller, service, DTOs, etc.)
pnpm exec nest g resource users --no-spec

# Generate individual modules/services/controllers
pnpm exec nest g module employees
pnpm exec nest g controller employees --no-spec
pnpm exec nest g service employees --no-spec
```

## Default Seeded Accounts

The project seeds these admin-level accounts during database seeding:

- SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
- ADMIN_EMAIL / ADMIN_PASSWORD
- DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD

These accounts are created with active status and role-based privileges.

## Notes

- This backend is designed to work with an employee approval flow where new employee registrations are created as `PENDING` and must be approved by an admin.
- The repository includes Prisma migration history and database schema definitions for departments, employees, payroll, and attendance models.
- Some workflow and business rules are managed through Prisma enums and validation DTOs in the `src` modules.

## Troubleshooting

If the database is not created yet:

```bash
node scripts/create-database.cjs
```

If Prisma client is out of sync with the schema:

```bash
pnpm exec prisma generate
```

If you want to reset the local development database and run the schema again, use the appropriate Prisma migration or database management commands for your local PostgreSQL instance.
