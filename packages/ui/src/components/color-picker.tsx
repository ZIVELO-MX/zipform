"use client";

import * as React from "react";
import { Field, FieldError } from "./field";
import { Input } from "./input";
import { cn } from "../lib/utils";

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

export function normalizeHexColor(value: string) {
  return value.trim().toUpperCase();
}

export function isHexColor(value: string) {
  return HEX_COLOR_PATTERN.test(normalizeHexColor(value));
}

export function ColorPicker({ value, onValueChange, label = "Color", className }: {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const inputId = React.useId();
  const errorId = `${inputId}-error`;
  const normalizedValue = normalizeHexColor(value);
  const [draft, setDraft] = React.useState(normalizedValue);
  const valid = isHexColor(draft);
  const preview = valid ? normalizeHexColor(draft) : normalizedValue;

  React.useEffect(() => setDraft(normalizedValue), [normalizedValue]);

  function commit() {
    const normalized = normalizeHexColor(draft);
    if (!isHexColor(normalized)) return;
    setDraft(normalized);
    if (normalized !== normalizedValue) onValueChange(normalized);
  }

  return (
    <Field className={cn("gap-1.5", className)} data-invalid={!valid}>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="size-8 shrink-0 rounded-lg border border-carbon/15 shadow-inner"
          style={{ backgroundColor: preview }}
          aria-hidden="true"
        />
        <Input
          id={inputId}
          className="min-w-0 font-mono text-xs font-semibold uppercase"
          value={draft}
          aria-label={label}
          aria-describedby={!valid ? errorId : undefined}
          aria-invalid={!valid}
          autoComplete="off"
          maxLength={7}
          spellCheck={false}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") {
              setDraft(normalizedValue);
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      {!valid ? (
        <FieldError id={errorId} className="text-xs font-semibold">
          Usa un HEX de seis dígitos, por ejemplo #D72228.
        </FieldError>
      ) : null}
    </Field>
  );
}
