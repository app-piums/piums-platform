-- CreateEnum
CREATE TYPE "BandMemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BandApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "bands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "coverPhoto" TEXT,
    "genre" TEXT[],
    "specialties" TEXT[],
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "leadArtistId" TEXT NOT NULL,
    "isBookable" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "bookingCount" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_members" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "role" TEXT,
    "status" "BandMemberStatus" NOT NULL DEFAULT 'PENDING',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "band_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_openings" (
    "id" TEXT NOT NULL,
    "bandId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "slots" INTEGER NOT NULL DEFAULT 1,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "band_openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "band_applications" (
    "id" TEXT NOT NULL,
    "openingId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "message" TEXT,
    "status" "BandApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "band_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bands_slug_key" ON "bands"("slug");
CREATE INDEX "bands_slug_idx" ON "bands"("slug");
CREATE INDEX "bands_leadArtistId_idx" ON "bands"("leadArtistId");
CREATE INDEX "bands_isActive_idx" ON "bands"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "band_members_bandId_artistId_key" ON "band_members"("bandId", "artistId");
CREATE INDEX "band_members_bandId_idx" ON "band_members"("bandId");
CREATE INDEX "band_members_artistId_idx" ON "band_members"("artistId");

-- CreateIndex
CREATE INDEX "band_openings_bandId_isOpen_idx" ON "band_openings"("bandId", "isOpen");

-- CreateIndex
CREATE UNIQUE INDEX "band_applications_openingId_artistId_key" ON "band_applications"("openingId", "artistId");
CREATE INDEX "band_applications_openingId_idx" ON "band_applications"("openingId");
CREATE INDEX "band_applications_artistId_idx" ON "band_applications"("artistId");

-- AddForeignKey
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_openings" ADD CONSTRAINT "band_openings_bandId_fkey" FOREIGN KEY ("bandId") REFERENCES "bands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "band_applications" ADD CONSTRAINT "band_applications_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "band_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
