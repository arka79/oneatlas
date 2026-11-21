-- Normalized catalog migration.
-- BenchmarkScore is renamed (not dropped) so existing illustrative scores survive.
-- New required columns are added with temporary defaults and the defaults are
-- then removed so the database matches `schema.prisma` exactly.

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('GENERAL', 'REASONING', 'CODING', 'MULTIMODAL', 'EMBEDDING');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('ILLUSTRATIVE', 'UNVERIFIED', 'VERIFIED', 'STALE');

-- Rename BenchmarkScore -> BenchmarkResult (preserve rows)
ALTER TABLE "BenchmarkScore" RENAME TO "BenchmarkResult";
ALTER TABLE "BenchmarkResult" RENAME CONSTRAINT "BenchmarkScore_pkey" TO "BenchmarkResult_pkey";
ALTER TABLE "BenchmarkResult" RENAME CONSTRAINT "BenchmarkScore_modelId_fkey" TO "BenchmarkResult_modelId_fkey";
ALTER TABLE "BenchmarkResult" RENAME CONSTRAINT "BenchmarkScore_benchmarkId_fkey" TO "BenchmarkResult_benchmarkId_fkey";
ALTER INDEX "BenchmarkScore_modelId_benchmarkId_key" RENAME TO "BenchmarkResult_modelId_benchmarkId_key";
DROP INDEX "BenchmarkScore_benchmarkId_idx";

-- AlterTable BenchmarkResult
ALTER TABLE "BenchmarkResult"
ADD COLUMN     "dataSource" TEXT NOT NULL DEFAULT 'Illustrative seed dataset',
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'ILLUSTRATIVE',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "sourceUrl" DROP NOT NULL,
DROP COLUMN "isIllustrative";

ALTER TABLE "BenchmarkResult" ALTER COLUMN "dataSource" DROP DEFAULT;
ALTER TABLE "BenchmarkResult" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable Benchmark
ALTER TABLE "Benchmark"
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataSource" TEXT NOT NULL DEFAULT 'Illustrative seed dataset',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" TEXT,
ALTER COLUMN "sourceUrl" DROP NOT NULL;

ALTER TABLE "Benchmark" ALTER COLUMN "dataSource" DROP DEFAULT;
ALTER TABLE "Benchmark" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable Model
ALTER TABLE "Model"
DROP COLUMN "isIllustrative",
ADD COLUMN     "dataSource" TEXT NOT NULL DEFAULT 'Illustrative seed dataset',
ADD COLUMN     "modelType" "ModelType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'ILLUSTRATIVE',
ALTER COLUMN "sourceUrl" DROP NOT NULL;

ALTER TABLE "Model" ALTER COLUMN "dataSource" DROP DEFAULT;
ALTER TABLE "Model" ALTER COLUMN "modelType" DROP DEFAULT;

-- AlterTable ModelProvider
ALTER TABLE "ModelProvider"
ADD COLUMN     "availableRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "ModelProvider" ALTER COLUMN "updatedAt" DROP DEFAULT;
DROP INDEX "ModelProvider_providerId_idx";

-- CreateTable Capability
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable ModelCapability
CREATE TABLE "ModelCapability" (
    "modelId" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModelCapability_pkey" PRIMARY KEY ("modelId","capabilityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Capability_slug_key" ON "Capability"("slug");

-- CreateIndex
CREATE INDEX "Capability_category_idx" ON "Capability"("category");

-- CreateIndex
CREATE INDEX "ModelCapability_capabilityId_idx" ON "ModelCapability"("capabilityId");

-- CreateIndex
CREATE INDEX "BenchmarkResult_benchmarkId_score_idx" ON "BenchmarkResult"("benchmarkId", "score" DESC);

-- CreateIndex
CREATE INDEX "BenchmarkResult_modelId_idx" ON "BenchmarkResult"("modelId");

-- CreateIndex
CREATE INDEX "BenchmarkResult_verificationStatus_idx" ON "BenchmarkResult"("verificationStatus");

-- CreateIndex
CREATE INDEX "Benchmark_category_idx" ON "Benchmark"("category");

-- CreateIndex
CREATE INDEX "Lab_name_idx" ON "Lab"("name");

-- CreateIndex
CREATE INDEX "Model_name_idx" ON "Model"("name");

-- CreateIndex
CREATE INDEX "Model_modelType_releaseDate_idx" ON "Model"("modelType", "releaseDate");

-- CreateIndex
CREATE INDEX "Model_verificationStatus_idx" ON "Model"("verificationStatus");

-- CreateIndex
CREATE INDEX "Model_modalities_idx" ON "Model" USING GIN ("modalities");

-- CreateIndex
CREATE INDEX "ModelProvider_providerId_isAvailable_idx" ON "ModelProvider"("providerId", "isAvailable");

-- CreateIndex
CREATE INDEX "Provider_name_idx" ON "Provider"("name");

-- CreateIndex
CREATE INDEX "Provider_regions_idx" ON "Provider" USING GIN ("regions");

-- AddForeignKey
ALTER TABLE "ModelCapability" ADD CONSTRAINT "ModelCapability_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelCapability" ADD CONSTRAINT "ModelCapability_capabilityId_fkey" FOREIGN KEY ("capabilityId") REFERENCES "Capability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
