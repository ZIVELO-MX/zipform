"use client";

import { useRouter } from "next/navigation";
import { CreateForm, type TlozCreateKind } from "../../../components/tloz/tloz-create";
import type { ContainerRecord, TlozFieldDefinition, TlozProject, UserProfile } from "@tloz/types";

export function CreateFormWrapper({ kind, projects, users, projectContracts = {}, canonicalContainer }: { kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; projectContracts?: Record<string, TlozFieldDefinition[]>; canonicalContainer?: ContainerRecord }) {
  const router = useRouter();
  return (
    <CreateForm
      kind={kind}
      projects={projects}
      users={users}
      projectContracts={projectContracts}
      canonicalContainer={canonicalContainer}
      onDone={() => router.push(kind === "workshop" || kind === "library" ? `/${kind}` : "/")}
    />
  );
}
