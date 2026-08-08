export type TlozDocumentErrorCode =
  | "DOCUMENT_INVALID"
  | "DOCUMENT_NOT_FOUND"
  | "DOCUMENT_REVISION_CONFLICT"
  | "DOCUMENT_CUTOVER_READ_ONLY";

export class TlozDocumentError extends Error {
  constructor(
    public readonly code: TlozDocumentErrorCode,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "TlozDocumentError";
  }
}
