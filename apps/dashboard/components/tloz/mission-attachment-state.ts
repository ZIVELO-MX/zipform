import type { AttachmentUploadItem } from "../../lib/tloz-attachments-client";
import type { TlozAttachmentGroup } from "@zipform/types";

export type AttachmentFileStatus = "pending" | "uploading" | "uploaded" | "error";
export type AttachmentBatchStatus = "idle" | "ready" | "preparing" | "uploading" | "finalizing" | "completed" | "error";

export type AttachmentItemState = AttachmentUploadItem & {
  status: AttachmentFileStatus;
  error?: string;
};

export type AttachmentUploadState = {
  groupKey: string;
  sourceRevision: string;
  status: AttachmentBatchStatus;
  items: AttachmentItemState[];
  uploadBatchId?: string;
  error?: string;
};

export type AttachmentStateAction =
  | { type: "select"; groupKey: string; sourceRevision: string; items: AttachmentUploadItem[] }
  | { type: "replace-item"; key: string; item: AttachmentUploadItem }
  | { type: "remove-item"; key: string }
  | { type: "preparing" }
  | { type: "prepared"; uploadBatchId: string }
  | { type: "uploading"; key: string }
  | { type: "uploaded"; key: string }
  | { type: "file-error"; key: string; message: string }
  | { type: "finalizing" }
  | { type: "completed"; group: TlozAttachmentGroup & { warnings?: string[] } }
  | { type: "error"; message: string }
  | { type: "reset" };

export const emptyAttachmentState: AttachmentUploadState = {
  groupKey: "",
  sourceRevision: "",
  status: "idle",
  items: [],
};

export function attachmentStateReducer(state: AttachmentUploadState, action: AttachmentStateAction): AttachmentUploadState {
  switch (action.type) {
    case "select":
      return { groupKey: action.groupKey, sourceRevision: action.sourceRevision, status: "ready", items: action.items.map((item) => ({ ...item, status: "pending" })) };
    case "replace-item":
      return { ...state, status: "ready", error: undefined, items: state.items.map((item) => item.key === action.key ? { ...action.item, key: item.key, status: "pending" } : item) };
    case "remove-item":
      return { ...state, status: state.items.length <= 1 ? "idle" : "ready", items: state.items.filter((item) => item.key !== action.key), error: undefined };
    case "preparing":
      return { ...state, status: "preparing", error: undefined, items: state.items.map((item) => ({ ...item, error: undefined })) };
    case "prepared":
      return { ...state, status: "uploading", uploadBatchId: action.uploadBatchId, error: undefined };
    case "uploading":
      return { ...state, status: "uploading", items: state.items.map((item) => item.key === action.key ? { ...item, status: "uploading", error: undefined } : item) };
    case "uploaded":
      return { ...state, items: state.items.map((item) => item.key === action.key ? { ...item, status: "uploaded", error: undefined } : item) };
    case "file-error":
      return { ...state, status: "error", error: undefined, items: state.items.map((item) => item.key === action.key ? { ...item, status: "error", error: action.message } : item) };
    case "finalizing":
      return { ...state, status: "finalizing", error: undefined };
    case "completed":
      return { ...state, status: "completed", error: action.group.warnings?.[0], items: state.items.map((item) => ({ ...item, status: "uploaded", error: undefined })) };
    case "error":
      return { ...state, status: "error", error: action.message };
    case "reset":
      return emptyAttachmentState;
  }
}

export function failedAttachmentKeys(state: AttachmentUploadState) {
  return new Set(state.items.filter((item) => item.status === "error").map((item) => item.key));
}

export function allAttachmentsUploaded(state: AttachmentUploadState) {
  return state.items.length > 0 && state.items.every((item) => item.status === "uploaded");
}
