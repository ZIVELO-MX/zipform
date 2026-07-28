import type { TlozFieldDefinition } from "@tloz/types";

export function normalizeFieldPositions(fields: TlozFieldDefinition[]) {
  return fields.map((field, position) => ({ ...field, position }));
}
