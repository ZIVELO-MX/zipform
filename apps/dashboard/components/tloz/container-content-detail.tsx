"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@tloz/ui";
import type { ContainerContentData, ContainerRecord, ContentRecord, UserProfile } from "@tloz/types";
import { ContainerContentField } from "./container-content-field";
import { apiErrorMessage } from "./container-content-view-model";

export function ContainerContentDetail({
  container,
  content,
  users,
  onChange,
}: {
  container: ContainerRecord;
  content: ContentRecord;
  users: UserProfile[];
  onChange?: (content: ContentRecord) => void;
}) {
  const detailView = container.definition.views.find((view) => view.id === "detail");
  const fields = (detailView?.fields ?? [])
    .filter((key) => !["publicId", "title", "summary", "body"].includes(key))
    .flatMap((key) => {
      const field = container.definition.fields.find((candidate) => candidate.key === key);
      return field?.visible === false || !field ? [] : [field];
    });
  const [title, setTitle] = useState(content.title);
  const [data, setData] = useState(content.data);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/v2/contents/${encodeURIComponent(content.id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "If-Match": `"${content.revision}"`,
          },
          body: JSON.stringify({ title: title.trim(), data }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setError(apiErrorMessage(payload, "No se pudo guardar el contenido."));
          return;
        }
        const updated = (payload as { data: ContentRecord }).data;
        setTitle(updated.title);
        setData(updated.data);
        onChange?.(updated);
      } catch {
        setError("No se pudo conectar con el servidor.");
      }
    });
  }

  return (
    <form className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-5 md:p-7" onSubmit={save}>
      <div>
        <label className="flex flex-col gap-1.5 text-xs font-bold text-carbon/60">
          Título
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <p className="mb-0 mt-2 font-mono text-[10.5px] font-medium text-carbon/40">{content.publicId}</p>
      </div>

      {fields.length > 0 ? (
        <section className="grid gap-4 rounded-2xl border border-carbon/10 bg-white p-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="flex min-w-0 flex-col gap-1.5 text-xs font-bold text-carbon/60">
              <span>{field.label}{field.required ? <span className="text-zivelo"> *</span> : null}</span>
              <ContainerContentField
                field={field}
                value={data[field.key]}
                users={users}
                onChange={(value: ContainerContentData) => setData((current) => ({ ...current, [field.key]: value }))}
              />
            </div>
          ))}
        </section>
      ) : null}

      {error ? <p className="m-0 text-xs font-semibold text-[#B91C22]" role="alert">{error}</p> : null}
      <div><Button type="submit" disabled={pending || !title.trim()}>{pending ? "Guardando…" : "Guardar"}</Button></div>
    </form>
  );
}
