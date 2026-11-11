# Employee Management System: Backend
This repository contains the backend API for an Employee Management System built with NestJS, Prisma, PostgreSQL, and JWT-based authentication.

It supports employee onboarding, department management, attendance tracking, payroll configuration, and role-based admin workflows.

Live Link: [https://ems-sh.netlify.app](https://ems-sh.netlify.app) 

Frontend Repository: [ems-frontend](https://github.com/Shahriar-Hossain-Alvi/ems-frontend).

## Features

- **Sign-up and approval:** a new account starts as `PENDING`; an admin approves or rejects it. Approval generates the employee ID (e.g. `EMP-00042`). Only `ACTIVE` accounts can log in.
- **Roles:** `SUPER_ADMIN`, `ADMIN`, `DEMO_ADMIN` (view-only) and `EMPLOYEE`, enforced by a permissions guard on every route.
- **Attendance:** clock in and out; lateness, work minutes and overtime follow an editable work policy (times compared in Asia/Dhaka). Admins can correct a record.
- **Payroll configuration:** reusable payroll heads (earning or deduction) with three calculation types (`FIXED`, `PERCENT_OF_BASIC`, `PER_UNIT`), grouped into payroll structures and assigned to employees.
- **Payroll run:** generate `DRAFT` payslips for a month, then publish. Published payslips are never overwritten; employees see only their own published payslips.
- **Admin data:** departments, work policy, employee directory, dashboards.
- Swagger UI at `/docs` in development.


## Tech Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Swagger/OpenAPI
- Class-validator / DTO validation



## Getting started

Requirements: Node.js 20+, pnpm, PostgreSQL.

1. Install packages:
   ```bash
   pnpm install
   ```
2. Create `.env` in the project root:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ems_dev"
   JWT_SECRET="change-me"
   JWT_EXPIRES_IN="3d"

   SUPER_ADMIN_EMAIL="superadmin@example.com"
   SUPER_ADMIN_PASSWORD="change-me"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="change-me"
   DEMO_ADMIN_EMAIL="demo@example.com"
   DEMO_ADMIN_PASSWORD="change-me"
   ```
3. Create the database, generate the client, migrate and seed:
   ```bash
   node scripts/create-database.cjs
   pnpm exec prisma generate
   pnpm exec prisma migrate dev
   pnpm exec prisma db seed
   ```
4. Start the server:
   ```bash
   pnpm run start:dev
   ```

The API runs at `http://localhost:3000` (no `/api` prefix); Swagger UI is at `http://localhost:3000/docs`. The seed creates the work policy and the admin-side accounts. Departments are added by an admin in the frontend.

## Payroll rules in short

- Late if clock-in is after shift start plus grace (default 09:15). Work minutes = elapsed minus break (default 60). Overtime = work minutes above standard hours (default 8).
- A payroll head set as basic (fixed earning) is required in a structure. `PERCENT_OF_BASIC` uses it; `PER_UNIT` multiplies by overtime hours, late days or absent days.
- Net pay = gross earnings minus deductions.
- An employee is skipped (with a reason) if the joining date is missing or later than the month, no structure is assigned, or the structure has no basic head.

## Limitations

- **No attendance device integration.** The web clock in/out buttons stand in for a time attendance device.
- No leave, holiday calendar, tax, email or password reset. Working days per month is a single setting (default 22).
- No automated tests yet; testing was manual.
- Payroll amounts are computed with rounded floating-point numbers and stored as decimals.

## Scripts

`pnpm run start:dev` (watch mode), `pnpm run build`, `pnpm run start:prod`, `pnpm run lint`.
