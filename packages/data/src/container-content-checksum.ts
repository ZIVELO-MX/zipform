import { createHash } from "crypto";
import {
  canonicalContainerContentJson,
  type ContainerContentSnapshot,
} from "./container-content-store";

export function checksumContainerContentSnapshot(snapshot: ContainerContentSnapshot): string {
  const normalized = {
    containers: [...snapshot.containers].sort((a, b) => a.id.localeCompare(b.id)),
    contents: [...snapshot.contents].sort((a, b) => a.id.localeCompare(b.id)),
  };
  return createHash("sha256")
    .update(canonicalContainerContentJson(normalized))
    .digest("hex");
}
