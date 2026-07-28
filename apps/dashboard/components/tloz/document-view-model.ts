import type {
  TlozDocument,
  TlozDocumentPresentationField,
  TlozDocumentScalar,
} from "@tloz/types";

export function documentValue(document: TlozDocument, key: string): TlozDocumentScalar {
  if (key === "title") return document.title;
  if (key === "publicId") return document.publicId;
  return document.properties[key] ?? null;
}

export function resolveVisibleDocumentFields(
  documents: TlozDocument[],
  fieldKeys: string[],
  fieldsByKey: Map<string, TlozDocumentPresentationField>,
) {
  return fieldKeys
    .map((key) => fieldsByKey.get(key))
    .filter((field): field is TlozDocumentPresentationField => Boolean(field?.visible))
    .filter((field) => (
      field.key === "title"
      || documents.some((document) => documentValue(document, field.key) !== null)
    ));
}
