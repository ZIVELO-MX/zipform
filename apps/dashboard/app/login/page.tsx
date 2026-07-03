"use client";

import { Button, Field, FieldError, FieldGroup, FieldLabel, FieldSeparator, Input } from "@zipform/ui";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type LoginErrors = { identifier?: string; password?: string; form?: string };

function safeCallbackUrl(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>(() =>
    searchParams.get("error") ? { form: "No fue posible autorizar esta cuenta de Zoho." } : {}
  );
  const [loading, setLoading] = useState<"credentials" | "zoho" | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {
      identifier: identifier.trim() ? undefined : "Ingresa tu email o usuario.",
      password: password ? undefined : "Ingresa tu contraseña."
    };
    setErrors(nextErrors);
    if (nextErrors.identifier || nextErrors.password) return;

    setLoading("credentials");
    try {
      const result = await signIn("credentials", { identifier: identifier.trim(), password, redirect: false });
      if (result?.error) {
        setErrors({ form: "El email, usuario o contraseña no son correctos." });
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrors({ form: "No se pudo iniciar sesión. Intenta nuevamente." });
    } finally {
      setLoading(null);
    }
  }

  async function handleZoho() {
    setErrors({});
    setLoading("zoho");
    await signIn("zoho", { callbackUrl });
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <section className="w-full max-w-[22rem]" aria-labelledby="login-title">
        <div className="mb-9 text-center">
          <span className="mx-auto mb-5 grid size-11 place-items-center rounded-[14px] bg-zivelo text-lg font-black text-white shadow-[0_12px_28px_rgba(215,34,40,0.22)]" aria-hidden="true">Z</span>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zivelo">Zipform</p>
          <h1 id="login-title" className="m-0 text-2xl font-bold tracking-tight text-carbon">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-carbon/55">Accede a la plataforma interna de Zivelo.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.identifier)}>
              <FieldLabel htmlFor="identifier">Email o usuario</FieldLabel>
              <Input id="identifier" name="identifier" type="text" autoComplete="username" enterKeyHint="next" required autoFocus value={identifier} aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? "identifier-error" : undefined} onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: undefined, form: undefined })); }} />
              <FieldError id="identifier-error">{errors.identifier}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="current-password">Contraseña</FieldLabel>
              <div className="relative">
                <Input id="current-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" enterKeyHint="done" required value={password} className="pr-11" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined, form: undefined })); }} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-carbon/50" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <FieldError id="password-error">{errors.password}</FieldError>
            </Field>

            <div className="min-h-5 text-center" aria-live="polite">{errors.form ? <p className="m-0 text-sm text-zivelo">{errors.form}</p> : null}</div>

            <Button type="submit" className="w-full" disabled={loading !== null}>
              {loading === "credentials" ? <LoaderCircle data-icon="inline-start" className="animate-spin motion-reduce:animate-none" /> : null}
              Entrar
            </Button>

            <FieldSeparator>O continúa con</FieldSeparator>

            <Button type="button" variant="outline" className="w-full" disabled={loading !== null} onClick={handleZoho}>
              {loading === "zoho" ? <LoaderCircle data-icon="inline-start" className="animate-spin motion-reduce:animate-none" /> : <span data-icon="inline-start" className="font-bold text-zivelo" aria-hidden="true">Z</span>}
              Zoho
            </Button>
          </FieldGroup>
        </form>
      </section>
    </main>
  );
}
