import type {
  ContainerContentData,
  ContainerDefinition,
  ContainerRecord,
  ContentRecord,
} from "@tloz/types";

export type ContainerContentErrorCode =
  | "STORE_INVALID"
  | "STORE_NOT_FOUND"
  | "STORE_REVISION_CONFLICT"
  | "STORE_REFERENCE_INVALID"
  | "STORE_UNAVAILABLE";

export class ContainerContentError extends Error {
  constructor(
    public readonly code: ContainerContentErrorCode,
    message: string,
    public readonly fields: Record<string, string> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ContainerContentError";
  }
}

export type ContainerContentSnapshot = {
  containers: ContainerRecord[];
  contents: ContentRecord[];
};

export type ContentFilters = {
  containerId?: string;
  presentation?: string;
  data?: Record<string, string | number | boolean | null>;
};

export type ContainerFilters = {
  presentation?: string;
};

export type StorePagination = { limit?: number; cursor?: string };
export type StorePage<T> = { data: T[]; nextCursor: string | null };

export type ContainerCreateInput = Omit<ContainerRecord, "id" | "revision" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type ContentCreateInput = Omit<ContentRecord, "id" | "revision" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type ContentUpdate = Partial<
  Pick<ContentRecord, "title" | "summary" | "body" | "presentation">
> & {
  data?: Record<string, ContainerContentData>;
};

export type MigrationReport = {
  inserted: number;
  updated: number;
  unchanged: number;
  checksum: string;
};

export interface ContainerContentStore {
  migrate(snapshot: ContainerContentSnapshot): Promise<MigrationReport>;
  createContainer(input: ContainerCreateInput): Promise<ContainerRecord>;
  createContent(input: ContentCreateInput): Promise<ContentRecord>;
  getContainer(id: string): Promise<ContainerRecord | null>;
  getContent(id: string): Promise<ContentRecord | null>;
  listContainers(filters?: ContainerFilters): Promise<ContainerRecord[]>;
  listContents(filters?: ContentFilters): Promise<ContentRecord[]>;
  findContainers(filters?: ContainerFilters, pagination?: StorePagination): Promise<StorePage<ContainerRecord>>;
  findContents(filters?: ContentFilters, pagination?: StorePagination): Promise<StorePage<ContentRecord>>;
  updateContainer(id: string, update: Partial<Pick<ContainerRecord, "slug" | "presentation" | "title" | "summary" | "body" | "definition" | "data">>, expectedRevision: number): Promise<ContainerRecord>;
  updateContent(
    id: string,
    update: ContentUpdate,
    expectedRevision: number,
  ): Promise<ContentRecord>;
  deleteContainer(id: string, expectedRevision: number): Promise<void>;
  deleteContent(id: string, expectedRevision: number): Promise<void>;
  exportSnapshot(): Promise<ContainerContentSnapshot>;
}

export function canonicalContainerContentJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortValue(child)]),
  );
}

export function validateContainerRecord(record: ContainerRecord): void {
  validateCommon(record, "container");
  if (
    !record.definition
    || Array.isArray(record.definition)
    || typeof record.definition !== "object"
    || !record.data
    || Array.isArray(record.data)
    || typeof record.data !== "object"
  ) {
    throw new ContainerContentError(
      "STORE_INVALID",
      "Container definition y data deben ser objetos.",
      { container: "invalid" },
    );
  }
}

export function validateContentRecord(record: ContentRecord): void {
  validateCommon(record, "content");
  if (
    !record.containerId.trim()
    || !record.data
    || Array.isArray(record.data)
    || typeof record.data !== "object"
  ) {
    throw new ContainerContentError(
      "STORE_INVALID",
      "Content no cumple el contrato nuclear.",
      { content: "invalid" },
    );
  }
}

export function getContentReferenceIds(record: ContentRecord): string[] {
  const relations = record.data.relations;
  if (relations === undefined || relations === null) return [];
  if (!Array.isArray(relations)) {
    throw new ContainerContentError("STORE_INVALID", "relations debe ser una lista.", {
      relations: "invalid",
    });
  }
  return relations.map((relation) => {
    if (
      !relation
      || Array.isArray(relation)
      || typeof relation !== "object"
      || typeof relation.contentId !== "string"
      || typeof relation.relation !== "string"
    ) {
      throw new ContainerContentError(
        "STORE_INVALID",
        "Cada relación debe incluir contentId y relation.",
        { relations: "invalid" },
      );
    }
    return relation.contentId;
  });
}

function validateCommon(
  record: Pick<ContainerRecord, "id" | "publicId" | "presentation" | "title" | "revision">,
  field: string,
) {
  if (
    !record.id.trim()
    || !record.publicId.trim()
    || !record.presentation.trim()
    || !record.title.trim()
    || !Number.isInteger(record.revision)
    || record.revision < 1
  ) {
    throw new ContainerContentError(
      "STORE_INVALID",
      `El ${field} no cumple el contrato nuclear.`,
      { [field]: "invalid" },
    );
  }
}

export type { ContainerContentData, ContainerDefinition, ContainerRecord, ContentRecord };
