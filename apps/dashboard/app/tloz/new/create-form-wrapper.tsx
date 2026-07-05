"use client";

import { useRouter } from "next/navigation";
import { CreateForm, type TlozCreateKind } from "../../../components/tloz/tloz-create";
import type { TlozProject, UserProfile } from "@zipform/types";

export function CreateFormWrapper({ kind, projects, users }: { kind: TlozCreateKind; projects: TlozProject[]; users: UserProfile[] }) {
  const router = useRouter();
  return (
    <CreateForm
      kind={kind}
      projects={projects}
      users={users}
      onDone={() => router.push("/tloz")}
    />
  );
}
