import type { DataClientOptions, DataDriver, ZipformDataClient } from "./contracts";
import { createMockDataClient } from "./drivers/mock";
import { createPrismaDataClient } from "./drivers/prisma";

export type {
  DataClientOptions,
  DataDriver,
  TlozDashboardSummary,
  TlozMissionDetail,
  TlozMissionRecord,
  TlozRepository,
  ZipformDataClient
} from "./contracts";
export { currentUser, raulUser } from "./seed-data";

function resolveDataDriver(driver?: DataDriver): DataDriver {
  if (driver) {
    return driver;
  }

  const configuredDriver = process.env.ZIPFORM_DATA_DRIVER;

  if (configuredDriver === "mock" || configuredDriver === "prisma") {
    return configuredDriver;
  }

  return "prisma";
}

export function createDataClient(options: DataClientOptions | DataDriver = {}): ZipformDataClient {
  const driver = typeof options === "string" ? options : resolveDataDriver(options.driver);

  if (driver === "mock") {
    return createMockDataClient();
  }

  if (driver === "prisma") {
    return createPrismaDataClient();
  }

  throw new Error(`Unsupported data driver: ${driver satisfies never}`);
}

export const dataClient = createDataClient();
