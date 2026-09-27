"use client";

import type { TlozMissionRecord } from "../../../lib/tloz-data";
import { useRouter } from "next/navigation";
import { CreateForm, type TlozCreateKind } from "../../../components/tloz/tloz-create";
import type { ContainerRecord, TlozFieldDefinition, TlozProject, UserProfile, TlozQuestItem } from "@tloz/types";

export function CreateFormWrapper({ kind, projects, users, projectContracts = {}, canonicalContainer, fixedProjectId, missions = [], questItems = [] }: { kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[]; projectContracts?: Record<string, TlozFieldDefinition[]>; canonicalContainer?: ContainerRecord; fixedProjectId?: string; missions?: TlozMissionRecord[]; questItems?: TlozQuestItem[] }) {
  const router = useRouter();
  return (
    <CreateForm
      kind={kind}
      fixedProjectId={fixedProjectId}
      missions={missions}
      questItems={questItems}
      projects={projects}
      users={users}
      projectContracts={projectContracts}
      canonicalContainer={canonicalContainer}
      onDone={() => router.push(kind === "workshop" || kind === "library" ? `/${kind}` : "/")}
    />
  );
}
