import { Skeleton } from "@zipform/ui";

export function TlozLoading() {
  return (
    <main className="page-stack tloz-page" aria-busy="true" aria-label="Cargando TLOZ">
      <div className="flex items-center justify-between border-b border-carbon/10 px-7 py-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 p-7 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <Skeleton className="h-44 rounded-2xl" key={index} />)}
      </div>
      <span className="sr-only" aria-live="polite">Cargando contenido</span>
    </main>
  );
}
