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

export type ContainerContentScalar = string | number | boolean | null;
export type ContainerContentData =
  | ContainerContentScalar
  | ContainerContentData[]
  | { [key: string]: ContainerContentData };

export type ContainerDefinition = {
  fields: Array<{
    key: string;
    label: string;
    format: string;
    required?: boolean;
    visible?: boolean;
    defaultValue?: ContainerContentData;
  }>;
  views: Array<{
    id: string;
    fields: string[];
    groupBy?: string;
    dateField?: string;
  }>;
  defaultView: string;
};

export type ContainerRecord = {
  id: string;
  publicId: string;
  slug?: string;
  presentation: string;
  title: string;
  summary: string;
  body: string;
  definition: ContainerDefinition;
  data: Record<string, ContainerContentData>;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ContentRecord = {
  id: string;
  publicId: string;
  containerId: string;
  presentation: string;
  title: string;
  summary: string;
  body: string;
  data: Record<string, ContainerContentData>;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ContainerContentSnapshot = {
  containers: ContainerRecord[];
  contents: ContentRecord[];
};

export type ContentFilters = {
  containerId?: string;
  presentation?: string;
  data?: Record<string, ContainerContentScalar>;
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
  createContainer(input: Omit<ContainerRecord, "id" | "revision" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ContainerRecord>;
  createContent(input: Omit<ContentRecord, "id" | "revision" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ContentRecord>;
  getContainer(id: string): Promise<ContainerRecord | null>;
  getContent(id: string): Promise<ContentRecord | null>;
  listContainers(filters?: { presentation?: string }): Promise<ContainerRecord[]>;
  listContents(filters?: ContentFilters): Promise<ContentRecord[]>;
  updateContainer(id: string, update: Partial<Pick<ContainerRecord, "slug" | "presentation" | "title" | "summary" | "body" | "definition" | "data">>, expectedRevision: number): Promise<ContainerRecord>;
  updateContent(id: string, update: ContentUpdate, expectedRevision: number): Promise<ContentRecord>;
  deleteContainer(id: string, expectedRevision: number): Promise<void>;
  deleteContent(id: string, expectedRevision: number): Promise<void>;
  exportSnapshot(): Promise<ContainerContentSnapshot>;
  restoreSnapshot(snapshot: ContainerContentSnapshot): Promise<void>;
  setAvailable(available: boolean): void;
}

type JsonbContainerRow = Omit<ContainerRecord, "definition" | "data"> & {
  definition: string;
  data: string;
};

type JsonbContentRow = Omit<ContentRecord, "data"> & {
  data: string;
};

type MongoContainerDocument = Omit<ContainerRecord, "id"> & {
  _id: string;
};

type MongoContentDocument = Omit<ContentRecord, "id"> & {
  _id: string;
};

interface PhysicalShape<ContainerRow, ContentRow> {
  encodeContainer(record: ContainerRecord): ContainerRow;
  decodeContainer(row: ContainerRow): ContainerRecord;
  encodeContent(record: ContentRecord): ContentRow;
  decodeContent(row: ContentRow): ContentRecord;
}

class PrototypeContainerContentStore<ContainerRow, ContentRow>
implements ContainerContentStore {
  private readonly containers = new Map<string, ContainerRow>();
  private readonly contents = new Map<string, ContentRow>();
  private available = true;

  constructor(private readonly shape: PhysicalShape<ContainerRow, ContentRow>) {}

  async createContainer(input: Omit<ContainerRecord, "id" | "revision" | "createdAt" | "updatedAt"> & { id?: string }) {
    this.assertAvailable();
    const now = new Date().toISOString();
    const record: ContainerRecord = {
      ...clone(input),
      id: input.id ?? crypto.randomUUID(),
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    validateSnapshot({ containers: [record], contents: [] });
    if ([...this.containers.values()].some((row) => this.shape.decodeContainer(row).publicId === record.publicId)) {
      throw new ContainerContentError("STORE_INVALID", "La identidad pública ya está en uso.", { publicId: "duplicate" });
    }
    this.containers.set(record.id, this.shape.encodeContainer(record));
    return clone(record);
  }

  async createContent(input: Omit<ContentRecord, "id" | "revision" | "createdAt" | "updatedAt"> & { id?: string }) {
    this.assertAvailable();
    const now = new Date().toISOString();
    const record: ContentRecord = {
      ...clone(input),
      id: input.id ?? crypto.randomUUID(),
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    validateContentRecord(record);
    if (!this.containers.has(record.containerId)) {
      throw new ContainerContentError("STORE_REFERENCE_INVALID", "El Container no existe.", { containerId: "not_found" });
    }
    validateContentReferences(record, new Set(this.contents.keys()));
    if ([...this.contents.values()].some((row) => this.shape.decodeContent(row).publicId === record.publicId)) {
      throw new ContainerContentError("STORE_INVALID", "La identidad pública ya está en uso.", { publicId: "duplicate" });
    }
    this.contents.set(record.id, this.shape.encodeContent(record));
    return clone(record);
  }

  async migrate(snapshot: ContainerContentSnapshot): Promise<MigrationReport> {
    this.assertAvailable();
    validateSnapshot(snapshot);

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const container of snapshot.containers) {
      const current = this.containers.get(container.id);
      if (!current) {
        this.containers.set(container.id, this.shape.encodeContainer(clone(container)));
        inserted += 1;
        continue;
      }
      const currentRecord = this.shape.decodeContainer(current);
      if (recordsEqual(currentRecord, container)) {
        unchanged += 1;
      } else {
        this.containers.set(container.id, this.shape.encodeContainer(clone(container)));
        updated += 1;
      }
    }

    for (const content of snapshot.contents) {
      const current = this.contents.get(content.id);
      if (!current) {
        this.contents.set(content.id, this.shape.encodeContent(clone(content)));
        inserted += 1;
        continue;
      }
      const currentRecord = this.shape.decodeContent(current);
      if (recordsEqual(currentRecord, content)) {
        unchanged += 1;
      } else {
        this.contents.set(content.id, this.shape.encodeContent(clone(content)));
        updated += 1;
      }
    }

    return {
      inserted,
      updated,
      unchanged,
      checksum: checksumSnapshot(await this.exportSnapshot()),
    };
  }

  async getContainer(id: string): Promise<ContainerRecord | null> {
    this.assertAvailable();
    const row = this.containers.get(id);
    return row ? clone(this.shape.decodeContainer(row)) : null;
  }

  async listContainers(filters: { presentation?: string } = {}): Promise<ContainerRecord[]> {
    this.assertAvailable();
    return [...this.containers.values()]
      .map((row) => this.shape.decodeContainer(row))
      .filter((container) => !filters.presentation || container.presentation === filters.presentation)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id))
      .map(clone);
  }

  async getContent(id: string): Promise<ContentRecord | null> {
    this.assertAvailable();
    const row = this.contents.get(id);
    return row ? clone(this.shape.decodeContent(row)) : null;
  }

  async listContents(filters: ContentFilters = {}): Promise<ContentRecord[]> {
    this.assertAvailable();
    return [...this.contents.values()]
      .map((row) => this.shape.decodeContent(row))
      .filter((content) => {
        if (filters.containerId && content.containerId !== filters.containerId) return false;
        if (filters.presentation && content.presentation !== filters.presentation) return false;
        return Object.entries(filters.data ?? {}).every(([key, value]) => content.data[key] === value);
      })
      .sort((left, right) => (
        right.updatedAt.localeCompare(left.updatedAt)
        || left.id.localeCompare(right.id)
      ))
      .map(clone);
  }

  async updateContent(
    id: string,
    update: ContentUpdate,
    expectedRevision: number,
  ): Promise<ContentRecord> {
    this.assertAvailable();
    const row = this.contents.get(id);
    if (!row) {
      throw new ContainerContentError(
        "STORE_NOT_FOUND",
        `Content ${id} no existe.`,
        { id: "not_found" },
      );
    }
    const current = this.shape.decodeContent(row);
    if (current.revision !== expectedRevision) {
      throw new ContainerContentError(
        "STORE_REVISION_CONFLICT",
        `La revisión ${expectedRevision} ya no está vigente.`,
        { revision: "conflict" },
      );
    }
    if (update.title !== undefined && !update.title.trim()) {
      throw new ContainerContentError(
        "STORE_INVALID",
        "El título no puede estar vacío.",
        { title: "required" },
      );
    }

    const updated: ContentRecord = {
      ...current,
      ...withoutUndefined(update),
      title: update.title?.trim() ?? current.title,
      summary: update.summary?.trim() ?? current.summary,
      body: update.body?.trim() ?? current.body,
      data: update.data ? { ...current.data, ...clone(update.data) } : current.data,
      revision: current.revision + 1,
      updatedAt: new Date(Date.parse(current.updatedAt) + 1_000).toISOString(),
    };
    validateContentReferences(updated, new Set(this.contents.keys()));
    this.contents.set(id, this.shape.encodeContent(updated));
    return clone(updated);
  }

  async updateContainer(
    id: string,
    update: Partial<Pick<ContainerRecord, "slug" | "presentation" | "title" | "summary" | "body" | "definition" | "data">>,
    expectedRevision: number,
  ) {
    this.assertAvailable();
    const row = this.containers.get(id);
    if (!row) throw new ContainerContentError("STORE_NOT_FOUND", `Container ${id} no existe.`, { id: "not_found" });
    const current = this.shape.decodeContainer(row);
    if (current.revision !== expectedRevision) throw new ContainerContentError("STORE_REVISION_CONFLICT", "La revisión ya no está vigente.", { revision: "conflict" });
    const updated: ContainerRecord = {
      ...current,
      ...withoutUndefined(update),
      title: update.title?.trim() ?? current.title,
      presentation: update.presentation?.trim() ?? current.presentation,
      data: update.data ? { ...current.data, ...clone(update.data) } : current.data,
      revision: current.revision + 1,
      updatedAt: new Date(Date.parse(current.updatedAt) + 1_000).toISOString(),
    };
    validateContainerRecord(updated);
    this.containers.set(id, this.shape.encodeContainer(updated));
    return clone(updated);
  }

  async deleteContent(id: string, expectedRevision: number): Promise<void> {
    this.assertAvailable();
    const row = this.contents.get(id);
    if (!row) throw new ContainerContentError("STORE_NOT_FOUND", `Content ${id} no existe.`, { id: "not_found" });
    if (this.shape.decodeContent(row).revision !== expectedRevision) throw new ContainerContentError("STORE_REVISION_CONFLICT", "La revisión ya no está vigente.", { revision: "conflict" });
    this.contents.delete(id);
  }

  async deleteContainer(id: string, expectedRevision: number): Promise<void> {
    this.assertAvailable();
    const row = this.containers.get(id);
    if (!row) throw new ContainerContentError("STORE_NOT_FOUND", `Container ${id} no existe.`, { id: "not_found" });
    if (this.shape.decodeContainer(row).revision !== expectedRevision) throw new ContainerContentError("STORE_REVISION_CONFLICT", "La revisión ya no está vigente.", { revision: "conflict" });
    if ([...this.contents.values()].some((content) => this.shape.decodeContent(content).containerId === id)) {
      throw new ContainerContentError("STORE_REFERENCE_INVALID", "No se puede borrar un Container con Content.", { containerId: "in_use" });
    }
    this.containers.delete(id);
  }

  async exportSnapshot(): Promise<ContainerContentSnapshot> {
    this.assertAvailable();
    return normalizeSnapshot({
      containers: [...this.containers.values()].map((row) => this.shape.decodeContainer(row)),
      contents: [...this.contents.values()].map((row) => this.shape.decodeContent(row)),
    });
  }

  async restoreSnapshot(snapshot: ContainerContentSnapshot): Promise<void> {
    this.assertAvailable();
    validateSnapshot(snapshot);
    this.containers.clear();
    this.contents.clear();
    for (const container of snapshot.containers) {
      this.containers.set(container.id, this.shape.encodeContainer(clone(container)));
    }
    for (const content of snapshot.contents) {
      this.contents.set(content.id, this.shape.encodeContent(clone(content)));
    }
  }

  setAvailable(available: boolean): void {
    this.available = available;
  }

  private assertAvailable() {
    if (!this.available) {
      throw new ContainerContentError(
        "STORE_UNAVAILABLE",
        "El store Container/Content no está disponible.",
      );
    }
  }
}

const jsonbShape: PhysicalShape<JsonbContainerRow, JsonbContentRow> = {
  encodeContainer: ({ definition, data, ...record }) => ({
    ...record,
    definition: JSON.stringify(definition),
    data: JSON.stringify(data),
  }),
  decodeContainer: ({ definition, data, ...row }) => ({
    ...row,
    definition: JSON.parse(definition) as ContainerDefinition,
    data: JSON.parse(data) as Record<string, ContainerContentData>,
  }),
  encodeContent: ({ data, ...record }) => ({ ...record, data: JSON.stringify(data) }),
  decodeContent: ({ data, ...row }) => ({
    ...row,
    data: JSON.parse(data) as Record<string, ContainerContentData>,
  }),
};

const mongoShape: PhysicalShape<MongoContainerDocument, MongoContentDocument> = {
  encodeContainer: ({ id, ...record }) => ({ _id: id, ...clone(record) }),
  decodeContainer: ({ _id, ...document }) => ({ id: _id, ...clone(document) }),
  encodeContent: ({ id, ...record }) => ({ _id: id, ...clone(record) }),
  decodeContent: ({ _id, ...document }) => ({ id: _id, ...clone(document) }),
};

export function createJsonbPrototypeStore(): ContainerContentStore {
  return new PrototypeContainerContentStore(jsonbShape);
}

export function createMongoPrototypeStore(): ContainerContentStore {
  return new PrototypeContainerContentStore(mongoShape);
}

export function checksumSnapshot(snapshot: ContainerContentSnapshot): string {
  const canonical = JSON.stringify(sortValue(normalizeSnapshot(snapshot)));
  let hash = 0xcbf29ce484222325n;
  for (const character of canonical) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

function validateSnapshot(snapshot: ContainerContentSnapshot) {
  const containerIds = uniqueIds(snapshot.containers, "containers");
  const contentIds = uniqueIds(snapshot.contents, "contents");
  for (const container of snapshot.containers) validateCommonRecord(container, "container");
  for (const content of snapshot.contents) {
    validateCommonRecord(content, "content");
    if (!containerIds.has(content.containerId)) {
      throw new ContainerContentError(
        "STORE_REFERENCE_INVALID",
        `El Container ${content.containerId} no existe.`,
        { containerId: "not_found" },
      );
    }
    validateContentReferences(content, contentIds);
  }
}

function uniqueIds(
  records: Array<{ id: string; publicId: string }>,
  field: string,
): Set<string> {
  const ids = new Set<string>();
  const publicIds = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id) || publicIds.has(record.publicId)) {
      throw new ContainerContentError(
        "STORE_INVALID",
        `El snapshot contiene identidades duplicadas en ${field}.`,
        { [field]: "duplicate" },
      );
    }
    ids.add(record.id);
    publicIds.add(record.publicId);
  }
  return ids;
}

function validateContainerRecord(record: ContainerRecord) {
  validateCommonRecord(record, "container");
  if (!record.definition || Array.isArray(record.definition) || typeof record.definition !== "object") {
    throw new ContainerContentError("STORE_INVALID", "Container definition debe ser un objeto.", { container: "invalid" });
  }
}

function validateContentRecord(record: ContentRecord) {
  validateCommonRecord(record, "content");
  if (!record.containerId.trim() || !record.data || Array.isArray(record.data) || typeof record.data !== "object") {
    throw new ContainerContentError("STORE_INVALID", "Content no cumple el contrato nuclear.", { content: "invalid" });
  }
}

function validateCommonRecord(
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

function validateContentReferences(content: ContentRecord, contentIds: Set<string>) {
  const relations = content.data.relations;
  if (relations === undefined || relations === null) return;
  if (!Array.isArray(relations)) {
    throw new ContainerContentError(
      "STORE_INVALID",
      "relations debe ser una lista.",
      { relations: "invalid" },
    );
  }
  for (const relation of relations) {
    if (!relation || Array.isArray(relation) || typeof relation !== "object") {
      throw new ContainerContentError(
        "STORE_INVALID",
        "Cada relación debe ser un objeto.",
        { relations: "invalid" },
      );
    }
    const targetId = relation.contentId;
    const relationType = relation.relation;
    if (
      typeof targetId !== "string"
      || typeof relationType !== "string"
      || !contentIds.has(targetId)
    ) {
      throw new ContainerContentError(
        "STORE_REFERENCE_INVALID",
        `Content ${String(targetId)} no existe.`,
        { relations: "not_found" },
      );
    }
  }
}

function normalizeSnapshot(snapshot: ContainerContentSnapshot): ContainerContentSnapshot {
  return {
    containers: snapshot.containers.map(clone).sort((left, right) => left.id.localeCompare(right.id)),
    contents: snapshot.contents.map(clone).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

function recordsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortValue(left)) === JSON.stringify(sortValue(right));
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

function clone<T>(value: T): T {
  return structuredClone(value);
}

function withoutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, child]) => child !== undefined),
  ) as Partial<T>;
}
