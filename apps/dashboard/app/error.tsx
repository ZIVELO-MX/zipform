"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@tloz/ui";

export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const params = new URLSearchParams(useSearchParams().toString());
  const paginated = params.has("cursor");
  params.delete("cursor");
  const query = params.toString();
  const firstPage = query ? `${pathname}?${query}` : pathname;

  return (
    <div className="grid min-h-[60dvh] place-items-center p-6">
      <section className="max-w-sm text-center" role="alert">
        <h1 className="text-base font-bold">No se pudo cargar esta página</h1>
        <p className="mt-2 text-[13px] text-carbon/65">Reintenta la carga o vuelve a una página disponible.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button type="button" size="sm" onClick={reset}>Reintentar</Button>
          <Button variant="outline" size="sm" asChild>
            <a href={paginated ? firstPage : "/"}>{paginated ? "Primera página" : "Ir al Lobby"}</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
