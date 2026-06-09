-- AlterTable: add column with default for existing rows, then remove default
ALTER TABLE "hotels" ADD COLUMN "price_per_night" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "hotels" ALTER COLUMN "price_per_night" DROP DEFAULT;
