const messages: Record<string, string> = {
  UNAUTHORIZED: "Tu sesión ya no es válida. Inicia sesión de nuevo.",
  FORBIDDEN: "No tienes permiso para realizar esta acción.",
  INVALID_REQUEST: "Revisa los datos e inténtalo de nuevo.",
  LAST_OWNER: "No se puede quitar al último Platform Owner.",
  CONFLICT: "El registro cambió. Actualiza la vista e inténtalo de nuevo.",
};

export function tlozErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { code?: unknown; message?: unknown };
    if (typeof candidate.code === "string" && messages[candidate.code]) return messages[candidate.code];
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      if (/último Platform Owner/i.test(candidate.message)) return messages.LAST_OWNER;
      if (/no tienes permisos|forbidden|no autorizado/i.test(candidate.message)) return messages.FORBIDDEN;
      return candidate.message;
    }
  }
  return fallback;
}
