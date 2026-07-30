import type { DataClientOptions, DataDriver, TlozDataClient } from "./contracts";
import { createMockDataClient } from "./drivers/mock";
import { createPrismaDataClient } from "./drivers/prisma";
export { getPrismaClient } from "./drivers/prisma";

export type {
  AgentCreateInput,
  TlozAttachmentBatch,
  TlozAttachmentFileInput,
  TlozAttachmentFinalizeResult,
  ApiKeyCreateResult,
  DataClientOptions,
  DataDriver,
  DocumentFilters,
  DocumentGetOptions,
  PaginatedResult,
  PaginationInput,
  ProjectFilters,
  QuestItemFilters,
  ResourceFilters,
  TlozDashboardSummary,
  TlozDocumentRepository,
  TlozMissionDetail,
  TlozMissionFilters,
  TlozMissionCreateInput,
  TlozMissionRecord,
  TlozMissionUpdateInput,
  TlozProjectCreateInput,
  TlozProjectUpdateInput,
  TlozQuestItemCreateInput,
  TlozQuestItemUpdateInput,
  TlozResourceInput,
  TlozRepository,
  UserFilters,
  UserRole,
  UserUpdateInput,
  TlozDataClient
} from "./contracts";
export { currentUser, raulUser } from "./seed-data";
export { assertProjectScopedDependency } from "./dependency-rules";
export { TlozValidationError, nextMissionDisplayId, slugify, uniqueSlug, validateMissionCreate, validateProjectCreate, validateQuestItemCreate } from "./tloz-validation";
export { TlozAttachmentBatchSupersededError, TlozAttachmentError } from "./tloz-attachment-errors";
export { TlozDocumentError } from "./document-errors";
export { createContainerContentDocumentRepository } from "./container-content-document";
export {
  ContainerContentError,
  type ContainerContentErrorCode,
  type ContainerContentSnapshot,
  type ContainerContentStore,
  type ContainerContentData,
  type ContainerDefinition,
  type ContainerRecord,
  type ContentRecord,
  type ContentFilters,
  type ContentUpdate,
  type MigrationReport,
} from "./container-content-store";
export {
  ContainerContentError,
  type ContainerContentErrorCode,
  type ContainerContentSnapshot,
  type ContainerContentStore,
  type ContentFilters,
  type ContentUpdate,
  type MigrationReport,
} from "./container-content-store";
export {
  defaultInventoryFields,
  defaultMissionFields,
  validateDocumentProperties,
  validateProjectFields,
} from "./document-contract";
export { parseTlozDocumentMarkdown, serializeTlozDocumentMarkdown } from "./document-markdown";
export { parseMarkdownChecklist } from "./tloz-hydration";

function resolveDataDriver(driver?: DataDriver): DataDriver {
  if (driver) {
    return driver;
  }

  const configuredDriver = process.env.TLOZ_DATA_DRIVER ?? process.env.ZIPFORM_DATA_DRIVER;

  if (configuredDriver === "mock" || configuredDriver === "prisma") {
    return configuredDriver;
  }

  return "prisma";
}

export function createDataClient(options: DataClientOptions | DataDriver = {}): TlozDataClient {
  const driver = typeof options === "string" ? options : resolveDataDriver(options.driver);

  if (driver === "mock") {
    return createMockDataClient();
  }

  if (driver === "prisma") {
    return createPrismaDataClient();
  }

  throw new Error(`Unsupported data driver: ${driver satisfies never}`);
}

const globalForData = globalThis as typeof globalThis & {
  __tlozDataClient?: TlozDataClient;
};

export const dataClient = new Proxy({} as TlozDataClient, {
  get(_, prop) {
    if (!globalForData.__tlozDataClient) {
      globalForData.__tlozDataClient = createDataClient();
    }
    return Reflect.get(globalForData.__tlozDataClient, prop, globalForData.__tlozDataClient);
  }
});
