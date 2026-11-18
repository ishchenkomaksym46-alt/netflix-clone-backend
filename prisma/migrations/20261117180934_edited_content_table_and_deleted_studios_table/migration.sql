/*
  Warnings:

  - You are about to drop the column `film_type` on the `content` table. All the data in the column will be lost.
  - You are about to drop the column `studio_id` on the `content` table. All the data in the column will be lost.
  - You are about to drop the `studios` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `director` to the `content` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "content" DROP CONSTRAINT "content_studio_id_fkey";

-- AlterTable
ALTER TABLE "content" DROP COLUMN "film_type",
DROP COLUMN "studio_id",
ADD COLUMN     "director" TEXT NOT NULL;

-- DropTable
DROP TABLE "studios";
