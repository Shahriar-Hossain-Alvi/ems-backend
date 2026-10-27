/*
  Warnings:

  - The values [APPROVED] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `Employee` table. All the data in the column will be lost.
  - Added the required column `workingDays` to the `Payslip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE');
ALTER TABLE "public"."User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User"
ALTER COLUMN "status" TYPE "AccountStatus_new"
USING (
    CASE
        WHEN "status"::text = 'APPROVED' THEN 'ACTIVE'
        ELSE "status"::text
    END
)::"AccountStatus_new";
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "status",
ALTER COLUMN "empCode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payslip"
ADD COLUMN "workingDays" INTEGER NOT NULL DEFAULT 22;

ALTER TABLE "Payslip"
ALTER COLUMN "workingDays" DROP DEFAULT;

-- DropEnum
DROP TYPE "EmployeeStatus";
