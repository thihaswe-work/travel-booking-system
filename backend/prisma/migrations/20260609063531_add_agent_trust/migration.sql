-- CreateEnum
CREATE TYPE "agent_trust_level" AS ENUM ('new', 'trusted');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approved_items_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trust_level" "agent_trust_level" NOT NULL DEFAULT 'new';
