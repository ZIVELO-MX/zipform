export class TlozUserRoleError extends Error {
  constructor(
    public readonly code: "LAST_OWNER",
    message: string,
  ) {
    super(message);
    this.name = "TlozUserRoleError";
  }
}

export class TlozLastOwnerError extends TlozUserRoleError {
  constructor() {
    super("LAST_OWNER", "No se puede eliminar al último Platform Owner.");
  }
}
