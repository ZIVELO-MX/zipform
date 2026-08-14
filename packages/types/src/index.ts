export type UserType = "human" | "agent";

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  type: UserType;
  avatarUrl: string;
  theme: "system" | "light" | "dark";
};

export type ApiKey = {
  id: string;
  userId: string;
  createdByUserId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlatformMetric = {
  label: string;
  value: string;
  tone: "good" | "warning" | "neutral";
};

export type TlozEntityStatus = "planned" | "active" | "completed" | "blocked" | "archived";
export type TlozProjectStatus = "planned" | "active" | "archived";
export type TlozProjectType = "normal" | "system";
export type TlozInventoryStatus = "locked" | "unlocked";
export type TlozInventoryCategory = "tool" | "access" | "asset" | "document" | "other";

export type Avatar = {
  id: string;
  name: string;
  imageUrl: string;
};

export type TlozDefaultMissionType =
  | "main_quest"
  | "side_quest"
  | "farming_quest"
  | "exploration_quest";

export type TlozDefaultMissionStatus = "now" | "next" | "later" | "completed" | "blocked";
export type TlozMissionType = string;
export type TlozMissionStatus = string;

export type TlozResourceType = "link" | "document" | "image" | "file" | "note";

export type TlozUserMissionSlot = "active_quest" | "support_quest";

export type TlozSeason = {
  id: string;
  name: string;
  version: string;
  description: string;
  status: TlozEntityStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozEpisode = {
  id: string;
  seasonId: string;
  name: string;
  romanNumber: string;
  description: string;
  status: TlozEntityStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozProject = {
  id: string;
  slug: string;
  name: string;
  description: string;
  descriptionDetail: string;
  color: string;
  icon: string;
  status: TlozProjectStatus;
  type: TlozProjectType;
  ownerId: string;
  startDate: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozMission = {
  id: string;
  displayId: string;
  title: string;
  description: string;
  descriptionDetail: string;
  icon: string;
  type: TlozMissionType;
  status: TlozMissionStatus;
  ownerId: string;
  projectId?: string;
  seasonId?: string;
  episodeId?: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  blockedReason?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

export type TlozMissionDependency = {
  id: string;
  missionId: string;
  dependsOnMissionId: string;
  createdAt: string;
};

export type TlozQuestItem = {
  id: string;
  name: string;
  description: string;
  descriptionDetail: string;
  icon: string;
  color: string;
  status: TlozInventoryStatus;
  category: TlozInventoryCategory;
  ownerId?: string;
  acquiredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozMissionQuestItem = {
  id: string;
  missionId: string;
  questItemId: string;
  required: boolean;
  createdAt: string;
};

export type TlozChecklistItem = {
  id: string;
  missionId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type TlozResource = {
  id: string;
  missionId?: string;
  projectId?: string;
  questItemId?: string;
  type: TlozResourceType;
  icon?: string;
  title: string;
  url?: string;
  fileId?: string;
  groupKey?: string;
  groupName?: string;
  externalKey?: string;
  storagePath?: string;
  contentType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  sourceRevision?: string;
  createdAt: string;
  updatedAt: string;
};

export type TlozAttachmentFile = {
  key: string;
  title: string;
  fileName: string;
  contentType: "image/png" | "image/jpeg" | "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
};

export type TlozAttachmentGroup = {
  groupKey: string;
  groupName?: string;
  sourceRevision: string;
  generation: number;
  attachments: Array<Omit<TlozResource, "url"> & { url: string }>;
};

export type TlozUserMissionState = {
  id: string;
  userId: string;
  missionId: string;
  slot: TlozUserMissionSlot;
  createdAt: string;
  updatedAt: string;
};

export type TlozDocumentKind = "project" | "mission" | "inventory";

export type TlozFieldType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "multiselect"
  | "person"
  | "relation";

export type TlozStatusRole = "backlog" | "ready" | "active" | "blocked" | "done";

export type TlozDocumentScalar = string | number | boolean | string[] | null;

export type TlozDocumentView =
  | "dashboard"
  | "list"
  | "board"
  | "table"
  | "calendar"
  | "detail";

export type TlozFieldOption = {
  value: string;
  label: string;
  color?: string;
  role?: TlozStatusRole;
};

export type TlozFieldDefinition = {
  id: string;
  key: string;
  label: string;
  type: TlozFieldType;
  required: boolean;
  visible: boolean;
  position: number;
  defaultValue?: TlozDocumentScalar;
  options: TlozFieldOption[];
};

export type TlozProjectContract = {
  projectId: string;
  fields: TlozFieldDefinition[];
};

export type TlozDocumentPresentationField = {
  key: string;
  label: string;
  format: "text" | "status" | "date" | "person" | "number" | "id";
  position: number;
  visible: boolean;
  options?: TlozFieldOption[];
};

export type TlozDocumentViewDefinition = {
  id: TlozDocumentView;
  fields: string[];
  groupBy?: string;
  dateField?: string;
};

export type TlozDocumentDefinition = {
  id: string;
  key: string;
  kind: TlozDocumentKind;
  scope: "collection" | "children";
  ownerDocumentId?: string;
  fields: TlozDocumentPresentationField[];
  views: TlozDocumentViewDefinition[];
  defaultView: TlozDocumentView;
};

export type TlozDocumentChildren = {
  data: TlozDocument[];
  nextCursor: string | null;
  total: number;
};

export type TlozDocument = {
  id: string;
  publicId: string;
  kind: TlozDocumentKind;
  parentId?: string;
  parentPublicId?: string;
  projectSlug?: string;
  title: string;
  summary: string;
  body: string;
  revision: number;
  properties: Record<string, TlozDocumentScalar>;
  contract?: TlozProjectContract;
  children?: TlozDocumentChildren;
  source?: {
    type: TlozDocumentKind;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type TlozDocumentUpdate = {
  title?: string;
  summary?: string;
  body?: string;
  properties?: Record<string, TlozDocumentScalar>;
};
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
    options?: TlozFieldOption[];
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
