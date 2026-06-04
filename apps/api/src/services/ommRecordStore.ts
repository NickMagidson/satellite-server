import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import type { NormalizedOmmRecord } from '../types.js';

export interface LoadStoredOmmsResult {
  records: unknown[];
}

export async function loadStoredOmms(databaseUrl: string | null): Promise<LoadStoredOmmsResult> {
  if (!databaseUrl) {
    return { records: [] };
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.ommRecord.findMany({
      orderBy: [{ noradCatId: 'asc' }, { epoch: 'asc' }],
      select: {
        rawOmm: true,
      },
    });

    return {
      records: rows.map((row) => row.rawOmm),
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function saveOmms(
  databaseUrl: string | null,
  omms: NormalizedOmmRecord[],
): Promise<number> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const operations = omms.map((omm) =>
      prisma.ommRecord.upsert({
        where: {
          noradCatId_epoch: {
            noradCatId: String(omm.NORAD_CAT_ID),
            epoch: new Date(omm.EPOCH),
          },
        },
        update: {
          objectId: omm.OBJECT_ID ?? null,
          objectName: omm.OBJECT_NAME ?? null,
          classificationType: omm.CLASSIFICATION_TYPE ?? null,
          meanMotion: omm.MEAN_MOTION,
          eccentricity: omm.ECCENTRICITY,
          inclination: omm.INCLINATION,
          raOfAscNode: omm.RA_OF_ASC_NODE,
          argOfPericenter: omm.ARG_OF_PERICENTER,
          meanAnomaly: omm.MEAN_ANOMALY,
          ephemerisType: omm.EPHEMERIS_TYPE === 0 || omm.EPHEMERIS_TYPE === '0' ? 0 : null,
          elementSetNo: omm.ELEMENT_SET_NO ? String(omm.ELEMENT_SET_NO) : null,
          revAtEpoch: omm.REV_AT_EPOCH ? String(omm.REV_AT_EPOCH) : null,
          bstar: omm.BSTAR,
          meanMotionDot: omm.MEAN_MOTION_DOT,
          meanMotionDdot: omm.MEAN_MOTION_DDOT,
          rawOmm: omm as never,
        },
        create: {
          noradCatId: String(omm.NORAD_CAT_ID),
          objectId: omm.OBJECT_ID ?? null,
          objectName: omm.OBJECT_NAME ?? null,
          classificationType: omm.CLASSIFICATION_TYPE ?? null,
          epoch: new Date(omm.EPOCH),
          meanMotion: omm.MEAN_MOTION,
          eccentricity: omm.ECCENTRICITY,
          inclination: omm.INCLINATION,
          raOfAscNode: omm.RA_OF_ASC_NODE,
          argOfPericenter: omm.ARG_OF_PERICENTER,
          meanAnomaly: omm.MEAN_ANOMALY,
          ephemerisType: omm.EPHEMERIS_TYPE === 0 || omm.EPHEMERIS_TYPE === '0' ? 0 : null,
          elementSetNo: omm.ELEMENT_SET_NO ? String(omm.ELEMENT_SET_NO) : null,
          revAtEpoch: omm.REV_AT_EPOCH ? String(omm.REV_AT_EPOCH) : null,
          bstar: omm.BSTAR,
          meanMotionDot: omm.MEAN_MOTION_DOT,
          meanMotionDdot: omm.MEAN_MOTION_DDOT,
          rawOmm: omm as never,
        },
      }),
    );

    await prisma.$transaction(operations);
    return omms.length;
  } finally {
    await prisma.$disconnect();
  }
}
