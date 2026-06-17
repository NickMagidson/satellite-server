import type { SatelliteCatalog } from './satelliteCatalog.js';
import { loadStoredOmms, saveOmms, type LoadStoredOmmsResult } from './ommRecordStore.js';
import { validateAndNormalizeOmms } from '../validation/ommValidation.js';
import { readJsonFile } from '../utils/jsonFile.js';
import type { NormalizedOmmRecord } from '../types.js';

export type InitialOmmSource = 'database' | 'seeded-database' | 'file';

export interface InitialOmmLoadResult {
  count: number;
  source: InitialOmmSource;
}

interface InitialOmmLoaderDependencies {
  loadStoredOmms: typeof loadStoredOmms;
  saveOmms: typeof saveOmms;
  readJsonFile: typeof readJsonFile;
}

interface LoadInitialOmmsOptions {
  catalog: SatelliteCatalog;
  databaseUrl: string | null;
  ommFile: string;
  dependencies?: InitialOmmLoaderDependencies;
}

const defaultDependencies: InitialOmmLoaderDependencies = {
  loadStoredOmms,
  saveOmms,
  readJsonFile,
};

function hasStoredRecords(storedOmms: LoadStoredOmmsResult): boolean {
  return storedOmms.records.length > 0;
}

async function readStarterOmms(
  ommFile: string,
  readStarterFile: typeof readJsonFile,
): Promise<NormalizedOmmRecord[]> {
  return validateAndNormalizeOmms(await readStarterFile(ommFile));
}

export async function loadInitialOmms({
  catalog,
  databaseUrl,
  ommFile,
  dependencies = defaultDependencies,
}: LoadInitialOmmsOptions): Promise<InitialOmmLoadResult> {
  const storedOmms = await dependencies.loadStoredOmms(databaseUrl);

  if (hasStoredRecords(storedOmms)) {
    const count = catalog.loadOmms(storedOmms.records);
    catalog.start();

    return {
      count,
      source: 'database',
    };
  }

  const starterOmms = await readStarterOmms(ommFile, dependencies.readJsonFile);

  if (!databaseUrl) {
    const count = catalog.loadOmms(starterOmms);
    catalog.start();

    return {
      count,
      source: 'file',
    };
  }

  await dependencies.saveOmms(databaseUrl, starterOmms);

  const seededOmms = await dependencies.loadStoredOmms(databaseUrl);
  const payload = hasStoredRecords(seededOmms) ? seededOmms.records : starterOmms;
  const count = catalog.loadOmms(payload);
  catalog.start();

  return {
    count,
    source: 'seeded-database',
  };
}
