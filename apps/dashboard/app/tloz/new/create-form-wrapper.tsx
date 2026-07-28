"use client";

import { useRouter } from "next/navigation";
import { CreateForm, type TlozCreateKind } from "../../../components/tloz/tloz-create";
import type { TlozFieldDefinition, TlozProject, UserProfile } from "@tloz/types";

export function CreateFormWrapper({ kind, projects, users, projectContracts = {} }: { kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; projectContracts?: Record<string, TlozFieldDefinition[]> }) {
  const router = useRouter();
  return (
    <CreateForm
      kind={kind}
      projects={projects}
      users={users}
      projectContracts={projectContracts}
      onDone={() => router.push("/")}
    />
  );
}
