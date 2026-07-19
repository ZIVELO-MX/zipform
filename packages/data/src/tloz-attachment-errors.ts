export class TlozAttachmentError extends Error {
  constructor(
    public readonly code: "ATTACHMENT_BATCH_NOT_FOUND" | "ATTACHMENT_BATCH_SUPERSEDED" | "ATTACHMENT_MISSION_NOT_FOUND" | "ATTACHMENT_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "TlozAttachmentError";
  }
}

export class TlozAttachmentBatchSupersededError extends TlozAttachmentError {
  constructor() {
    super("ATTACHMENT_BATCH_SUPERSEDED", "El lote de capturas fue superado por una generación posterior.");
  }
}
