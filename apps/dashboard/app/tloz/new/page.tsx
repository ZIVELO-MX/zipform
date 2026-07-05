import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateFormWrapper } from "./create-form-wrapper";
import { type TlozCreateKind } from "../../../components/tloz/tloz-create";
import { getTlozProjects, getTlozUsers } from "../../../lib/tloz-data";

const validKinds: TlozCreateKind[] = ["mission", "project", "inventory"];
const kindLabel = { mission: "Mission", project: "Project", inventory: "Inventory item" } as const;

export default async function NewEntityPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const resolvedKind: TlozCreateKind = validKinds.includes(kind as TlozCreateKind) ? (kind as TlozCreateKind) : "mission";
  const [projects, users] = await Promise.all([getTlozProjects(), getTlozUsers()]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-carbon/10 px-4 py-3">
        <Link
          href="/tloz"
          className="grid size-8 place-items-center rounded-lg text-carbon/60 hover:bg-carbon/5"
          aria-label="Volver al lobby"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <h1 className="m-0 text-sm font-bold text-carbon/75">Nuevo {kindLabel[resolvedKind]}</h1>
      </header>
      <CreateFormWrapper kind={resolvedKind} projects={projects} users={users} />
    </div>
  );
}
