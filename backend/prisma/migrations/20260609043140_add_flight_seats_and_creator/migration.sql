/*
  Warnings:

  - You are about to drop the column `available_seats` on the `flights` table. All the data in the column will be lost.
  - You are about to drop the column `base_price` on the `flights` table. All the data in the column will be lost.
  - You are about to drop the column `seat_class` on the `flights` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "flights" DROP COLUMN "available_seats",
DROP COLUMN "base_price",
DROP COLUMN "seat_class",
ADD COLUMN     "created_by_id" UUID;

-- AlterTable
ALTER TABLE "hotels" ADD COLUMN     "created_by_id" UUID;

-- AlterTable
ALTER TABLE "tours" ADD COLUMN     "created_by_id" UUID;

-- CreateTable
CREATE TABLE "flight_seats" (
    "id" UUID NOT NULL,
    "flight_id" UUID NOT NULL,
    "seat_class" "seat_class" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "available_seats" INTEGER NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_seats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_seats_flight_id_idx" ON "flight_seats"("flight_id");

-- CreateIndex
CREATE UNIQUE INDEX "flight_seats_flight_id_seat_class_key" ON "flight_seats"("flight_id", "seat_class");

-- CreateIndex
CREATE INDEX "flights_created_by_id_idx" ON "flights"("created_by_id");

-- CreateIndex
CREATE INDEX "hotels_created_by_id_idx" ON "hotels"("created_by_id");

-- CreateIndex
CREATE INDEX "tours_created_by_id_idx" ON "tours"("created_by_id");

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_seats" ADD CONSTRAINT "flight_seats_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "flights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tours" ADD CONSTRAINT "tours_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
