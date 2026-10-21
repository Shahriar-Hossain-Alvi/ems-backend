/*
  Warnings:

  - The `status` column on the `Employee` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "status",
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';
