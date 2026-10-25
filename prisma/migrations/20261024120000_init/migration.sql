-- CreateEnum
CREATE TYPE "Role" AS ENUM ('RIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('UNCLAIMED', 'ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RIDER',
    "liveRideActive" BOOLEAN NOT NULL DEFAULT false,
    "lastKnownLat" DOUBLE PRECISION,
    "lastKnownLng" DOUBLE PRECISION,
    "lastGpsAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "activationPinHash" TEXT NOT NULL,
    "activationPinEncrypted" TEXT NOT NULL,
    "batchName" TEXT NOT NULL,
    "nfcSerialNumber" TEXT,
    "isNfcEncoded" BOOLEAN NOT NULL DEFAULT false,
    "isLockedReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "status" "DeviceStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "userId" UUID,
    "lastAlertAt" TIMESTAMPTZ(3),
    "lastAlertLat" DOUBLE PRECISION,
    "lastAlertLng" DOUBLE PRECISION,
    "encodedAt" TIMESTAMPTZ(3),
    "activatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "photoPublicId" TEXT,
    "birthDate" TIMESTAMPTZ(3),
    "bloodType" TEXT NOT NULL,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "medications" TEXT,
    "insuranceInfo" TEXT,
    "emergencyNumber" TEXT,
    "emergencyContacts" JSONB NOT NULL DEFAULT '[]',
    "locale" TEXT,
    "consentAcceptedAt" TIMESTAMPTZ(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentIpHash" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MedicalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyAlert" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "scanSource" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracyMeters" DOUBLE PRECISION,
    "dmsFormatted" TEXT NOT NULL,
    "googleMapsUrl" TEXT NOT NULL,
    "locationOrigin" TEXT NOT NULL,
    "emailsSentCount" INTEGER NOT NULL DEFAULT 0,
    "emailDelivery" JSONB,
    "wasThrottled" BOOLEAN NOT NULL DEFAULT false,
    "scannerIp" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
    "blockedUntil" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Device_userId_key" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Device_batchName_idx" ON "Device"("batchName");

-- CreateIndex
CREATE INDEX "Device_createdAt_idx" ON "Device"("createdAt");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalProfile_userId_key" ON "MedicalProfile"("userId");

-- CreateIndex
CREATE INDEX "MedicalProfile_userId_idx" ON "MedicalProfile"("userId");

-- CreateIndex
CREATE INDEX "EmergencyAlert_deviceId_createdAt_idx" ON "EmergencyAlert"("deviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "EmergencyAlert_createdAt_idx" ON "EmergencyAlert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_key_key" ON "RateLimitBucket"("key");

-- CreateIndex
CREATE INDEX "RateLimitBucket_scope_idx" ON "RateLimitBucket"("scope");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalProfile" ADD CONSTRAINT "MedicalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

