"use client";

import { createContext, useContext, useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, Input, SlideOver } from "@tloz/ui";
import type { ContainerContentData, ContainerRecord, UserProfile } from "@tloz/types";
import { ContainerContentField } from "./container-content-field";
import { apiErrorMessage, createContentPayload } from "./container-content-view-model";

const ContainerContentCreateContext = createContext<{ label: string; openCreate: () => void } | null>(null);

export function ContainerContentCreateProvider({
  children,
  container,
  users,
  currentUserId,
}: {
  children: React.ReactNode;
  container: ContainerRecord;
  users: UserProfile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const initialData = useMemo(() => createDefaults(container, currentUserId), [container, currentUserId]);
  const [data, setData] = useState(initialData);
  const fields = container.definition.fields.filter((field) => field.visible !== false);
  const context = useMemo(() => ({
    label: container.title,
    openCreate: () => setOpen(true),
  }), [container.title]);

  function reset() {
    setTitle("");
    setData(initialData);
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/v2/contents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createContentPayload(
            container,
            title,
            data,
            `${container.presentation}-${crypto.randomUUID()}`,
          )),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setError(apiErrorMessage(payload, "No se pudo crear el contenido."));
          return;
        }
        reset();
        setOpen(false);
        router.refresh();
      } catch {
        setError("No se pudo conectar con el servidor.");
      }
    });
  }

  return (
    <ContainerContentCreateContext.Provider value={context}>
      {children}
      <SlideOver
        open={open}
        title={`Crear ${container.title}`}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next && !pending) reset();
        }}
        footer={(
          <>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form={formId} disabled={pending || !title.trim()}>{pending ? "Creando…" : "Guardar"}</Button>
          </>
        )}
      >
        <form id={formId} className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6" onSubmit={submit}>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-carbon/60">
            Título <span className="text-zivelo">*</span>
            <Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <section className="grid gap-4 rounded-2xl border border-carbon/10 bg-white p-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-carbon/60">
                <span>{field.label}{field.required ? <span className="text-zivelo"> *</span> : null}</span>
                <ContainerContentField
                  field={field}
                  value={data[field.key]}
                  users={users}
                  onChange={(value) => setData((current) => ({ ...current, [field.key]: value }))}
                />
              </div>
            ))}
          </section>
          {error ? <p className="m-0 text-xs font-semibold text-[#B91C22]" role="alert">{error}</p> : null}
        </form>
      </SlideOver>
    </ContainerContentCreateContext.Provider>
  );
}

export function ContainerContentCreateControl() {
  const context = useContext(ContainerContentCreateContext);
  if (!context) throw new Error("ContainerContentCreateControl must be used inside ContainerContentCreateProvider");
  return (
    <Button type="button" className="w-full justify-center bg-zivelo text-white hover:bg-zivelo/90" onClick={context.openCreate}>
      <Plus aria-hidden="true" />
      Crear nuevo {context.label}
    </Button>
  );
}

function createDefaults(container: ContainerRecord, currentUserId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return Object.fromEntries(container.definition.fields.flatMap((field) => {
    if (field.key === "ownerId") return [[field.key, currentUserId]];
    if (field.key === "startDate") return [[field.key, today]];
    return field.defaultValue === undefined ? [] : [[field.key, field.defaultValue]];
  })) as Record<string, ContainerContentData>;
}
