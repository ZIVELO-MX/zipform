"use client";

import { Button } from "@zipform/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function TlozError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center p-8">
      <section className="max-w-md rounded-2xl border border-carbon/10 bg-paper p-8 text-center shadow-sm" role="alert">
        <AlertTriangle className="mx-auto mb-4 text-destructive" aria-hidden="true" />
        <h1 className="text-xl font-bold">No pudimos cargar TLOZ</h1>
        <p className="mt-2 text-sm text-carbon/65">La información no está disponible temporalmente. Puedes volver a intentar sin perder tu navegación.</p>
        <Button className="mt-6" onClick={reset}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Reintentar
        </Button>
      </section>
    </main>
  );
}
