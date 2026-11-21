import { PrismaClient } from "@prisma/client";
import {
  SEED_META,
  benchmarks,
  capabilities,
  labs,
  models,
  providers,
} from "./seed-data";

/**
 * Repeatable seed: every record is upserted by its unique slug, child rows are
 * replaced, and records removed from the dataset are deleted. Re-running this
 * script always leaves the same catalog rather than accumulating duplicates.
 *
 * Run with `npm run db:seed`. The Prisma config file (`prisma.config.ts`) wires
 * that command to this script for Prisma 6.
 *
 * Everything written here is `ILLUSTRATIVE`. `sourceUrl` is deliberately null:
 * the dataset must not imply a vendor or benchmark citation it does not have.
 */
const prisma = new PrismaClient();

const seededAt = new Date(`${SEED_META.revisionDate}T00:00:00.000Z`);

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  console.log(`\nSeeding ${SEED_META.label} (revision ${SEED_META.revisionDate}).`);
  console.log(`${SEED_META.note}\n`);

  const capabilityIds = new Map<string, string>();
  for (const capability of capabilities) {
    const record = await prisma.capability.upsert({
      where: { slug: capability.slug },
      update: {
        name: capability.name,
        description: capability.description,
        category: capability.category,
      },
      create: capability,
    });
    capabilityIds.set(capability.slug, record.id);
  }

  const labIds = new Map<string, string>();
  for (const lab of labs) {
    const record = await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: {
        name: lab.name,
        description: lab.description,
        websiteUrl: lab.websiteUrl,
        country: lab.country,
        foundedYear: lab.foundedYear,
      },
      create: lab,
    });
    labIds.set(lab.slug, record.id);
  }

  const providerIds = new Map<string, string>();
  const providerBySlug = new Map(providers.map((provider) => [provider.slug, provider]));
  for (const provider of providers) {
    const record = await prisma.provider.upsert({
      where: { slug: provider.slug },
      update: {
        name: provider.name,
        description: provider.description,
        websiteUrl: provider.websiteUrl,
        regions: provider.regions,
      },
      create: provider,
    });
    providerIds.set(provider.slug, record.id);
  }

  const benchmarkIds = new Map<string, string>();
  for (const benchmark of benchmarks) {
    const record = await prisma.benchmark.upsert({
      where: { slug: benchmark.slug },
      update: {
        name: benchmark.name,
        description: benchmark.description,
        category: benchmark.category,
        unit: benchmark.unit,
        higherIsBetter: benchmark.higherIsBetter,
        version: benchmark.version,
        dataSource: SEED_META.dataSource,
        sourceUrl: null,
        lastUpdated: seededAt,
      },
      create: {
        ...benchmark,
        dataSource: SEED_META.dataSource,
        sourceUrl: null,
        lastUpdated: seededAt,
      },
    });
    benchmarkIds.set(benchmark.slug, record.id);
  }

  const modelIds = new Map<string, string>();
  for (const model of models) {
    const labId = labIds.get(model.labSlug);
    if (!labId) {
      throw new Error(`Unknown lab slug "${model.labSlug}" for model "${model.slug}"`);
    }

    const modelData = {
      name: model.name,
      description: model.description,
      labId,
      modelType: model.modelType,
      releaseDate: toDate(model.releaseDate),
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      knowledgeCutoff: model.knowledgeCutoff,
      inputPricePerMTokUsd: model.inputPricePerMTokUsd,
      outputPricePerMTokUsd: model.outputPricePerMTokUsd,
      modalities: model.modalities,
      isOpenWeights: model.isOpenWeights,
      license: model.license,
      dataSource: SEED_META.dataSource,
      sourceUrl: null,
      lastUpdated: seededAt,
      verificationStatus: SEED_META.verificationStatus,
    };

    const record = await prisma.model.upsert({
      where: { slug: model.slug },
      update: modelData,
      create: { slug: model.slug, ...modelData },
    });
    modelIds.set(model.slug, record.id);

    // Listings and capabilities are replaced, so removed entries disappear.
    await prisma.modelProvider.deleteMany({ where: { modelId: record.id } });
    if (model.providerSlugs.length > 0) {
      await prisma.modelProvider.createMany({
        data: model.providerSlugs.map((providerSlug) => {
          const providerId = providerIds.get(providerSlug);
          const provider = providerBySlug.get(providerSlug);
          if (!providerId || !provider) {
            throw new Error(`Unknown provider slug "${providerSlug}" for model "${model.slug}"`);
          }

          const override = model.providerPricing?.[providerSlug];
          return {
            modelId: record.id,
            providerId,
            isAvailable: true,
            availableRegions: provider.regions,
            inputPricePerMTokUsd: override?.inputPricePerMTokUsd ?? null,
            outputPricePerMTokUsd: override?.outputPricePerMTokUsd ?? null,
            notes: override ? "Illustrative provider-specific rate." : null,
          };
        }),
      });
    }

    await prisma.modelCapability.deleteMany({ where: { modelId: record.id } });
    if (model.capabilitySlugs.length > 0) {
      await prisma.modelCapability.createMany({
        data: model.capabilitySlugs.map((capabilitySlug) => {
          const capabilityId = capabilityIds.get(capabilitySlug);
          if (!capabilityId) {
            throw new Error(
              `Unknown capability slug "${capabilitySlug}" for model "${model.slug}"`,
            );
          }
          return { modelId: record.id, capabilityId };
        }),
      });
    }

    // Replace result rows so a benchmark removed from the dataset does not
    // leave a stale score behind.
    await prisma.benchmarkResult.deleteMany({ where: { modelId: record.id } });
    const scoreEntries = Object.entries(model.scores ?? {}) as Array<[string, number]>;
    if (scoreEntries.length > 0) {
      await prisma.benchmarkResult.createMany({
        data: scoreEntries.map(([benchmarkSlug, score]) => {
          const benchmarkId = benchmarkIds.get(benchmarkSlug);
          if (!benchmarkId) {
            throw new Error(
              `Unknown benchmark slug "${benchmarkSlug}" for model "${model.slug}"`,
            );
          }
          return {
            modelId: record.id,
            benchmarkId,
            score,
            dataSource: SEED_META.dataSource,
            sourceUrl: null,
            lastUpdated: seededAt,
            verificationStatus: SEED_META.verificationStatus,
          };
        }),
      });
    }
  }

  // Dataset cleanup: delete rows that are no longer part of the seed. Models
  // are removed first so cascades clear listings, capabilities, and results
  // before their parent labs/providers/benchmarks are touched.
  await prisma.model.deleteMany({ where: { slug: { notIn: models.map((m) => m.slug) } } });
  await prisma.lab.deleteMany({ where: { slug: { notIn: labs.map((l) => l.slug) } } });
  await prisma.provider.deleteMany({ where: { slug: { notIn: providers.map((p) => p.slug) } } });
  await prisma.benchmark.deleteMany({
    where: { slug: { notIn: benchmarks.map((b) => b.slug) } },
  });
  await prisma.capability.deleteMany({
    where: { slug: { notIn: capabilities.map((c) => c.slug) } },
  });

  const [
    modelCount,
    labCount,
    providerCount,
    benchmarkCount,
    capabilityCount,
    offeringCount,
    resultCount,
    modelCapabilityCount,
  ] = await Promise.all([
    prisma.model.count(),
    prisma.lab.count(),
    prisma.provider.count(),
    prisma.benchmark.count(),
    prisma.capability.count(),
    prisma.modelProvider.count(),
    prisma.benchmarkResult.count(),
    prisma.modelCapability.count(),
  ]);

  console.log("Seed complete:");
  console.table({
    models: modelCount,
    labs: labCount,
    providers: providerCount,
    benchmarks: benchmarkCount,
    capabilities: capabilityCount,
    providerListings: offeringCount,
    benchmarkResults: resultCount,
    modelCapabilities: modelCapabilityCount,
  });
  console.log("\nAll seeded records are illustrative. Do not present them as live data.\n");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
