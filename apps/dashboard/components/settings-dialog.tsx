"use client";

import {
  Check,
  Copy,
  KeyRound,
  Mail,
  Monitor,
  Moon,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogContent,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Separator,
  UserPicker,
  cn,
  toast,
} from "@zipform/ui";
import type { UserProfile } from "@zipform/types";
import { updateProfile } from "../lib/settings-actions";

type SettingsSection = "profile" | "security";
type ThemeValue = "system" | "light" | "dark";

const sections: Array<{ id: SettingsSection; label: string; icon: LucideIcon }> = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
];

const themeOptions: Array<{ label: string; value: ThemeValue; icon: LucideIcon }> = [
  { label: "Sistema", value: "system", icon: Monitor },
  { label: "Claro", value: "light", icon: Sun },
  { label: "Oscuro", value: "dark", icon: Moon },
];

const avatars = [
  { key: "wolf", name: "Lobo", emoji: "🐺", background: "#454543" },
  { key: "fox", name: "Zorro", emoji: "🦊", background: "#D72228" },
  { key: "knight", name: "Caballero", emoji: "⚔️", background: "#2D6CDF" },
  { key: "wizard", name: "Mago", emoji: "🧙", background: "#7A4ED9" },
  { key: "archer", name: "Arquera", emoji: "🏹", background: "#1E8E5A" },
  { key: "smith", name: "Herrero", emoji: "🔨", background: "#7A5A12" },
  { key: "druid", name: "Druida", emoji: "🌿", background: "#1E6B3C" },
  { key: "bard", name: "Bardo", emoji: "🎵", background: "#C0397A" },
];

const agents = [{ id: "zibot", name: "zibot", username: "zibot" }];

function findAvatar(emoji: string) {
  if (!emoji) return null;
  return avatars.find((a) => a.emoji === emoji) ?? avatars[1];
}

function isEmoji(str: string) {
  return /^\p{Extended_Pictographic}/u.test(str);
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
}) {
  const [section, setSection] = useState<SettingsSection>("profile");
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [theme, setTheme] = useState<ThemeValue>(user.theme || "system");
  const [avatarEmoji, setAvatarEmoji] = useState(user.avatarUrl && isEmoji(user.avatarUrl) ? user.avatarUrl : "");
  const [avatarSearch, setAvatarSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const currentAvatar = findAvatar(avatarEmoji);
  const filteredAvatars = avatars.filter((a) =>
    a.name.toLocaleLowerCase("es").includes(avatarSearch.trim().toLocaleLowerCase("es"))
  );

  const hasChanges = name !== user.name || username !== user.username || theme !== (user.theme || "system") || avatarEmoji !== (user.avatarUrl && isEmoji(user.avatarUrl) ? user.avatarUrl : "");

  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        await updateProfile({ name, username, theme, avatarUrl: avatarEmoji });
        toast.success("Perfil actualizado");
        onOpenChange(false);
      } catch {
        toast.error("Error al guardar los cambios");
      }
    });
  }, [name, username, theme, avatarEmoji, onOpenChange]);

  const handleCancel = useCallback(() => {
    setName(user.name);
    setUsername(user.username);
    setTheme(user.theme || "system");
    setAvatarEmoji(user.avatarUrl && isEmoji(user.avatarUrl) ? user.avatarUrl : "");
    onOpenChange(false);
  }, [onOpenChange, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Configuración" className="h-[min(680px,calc(100dvh-96px))] max-w-[620px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0">
        <header className="flex items-center justify-between border-b border-carbon/[0.08] px-5 py-[17px] md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-tintred text-zivelo">
              <Settings className="size-4" aria-hidden="true" />
            </span>
            <h1 className="m-0 truncate text-base font-bold text-carbon">Configuración</h1>
          </div>
          <Button type="button" variant="outline" size="icon-xs" aria-label="Cerrar" className="rounded-full bg-white" onClick={() => onOpenChange(false)}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="grid min-h-0 grid-cols-1 bg-[#FCFCFB] md:grid-cols-[142px_minmax(0,1fr)]">
          <aside className="border-b border-carbon/[0.08] bg-[#FAFAF9] p-2.5 md:border-b-0 md:border-r md:pt-5">
            <nav className="flex gap-2 md:flex-col" aria-label="Secciones de configuración">
              {sections.map((item) => {
                const Icon = item.icon;
                const selected = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      "flex min-h-9 flex-1 items-center gap-2 rounded-[10px] px-3 text-left text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carbon/25 md:flex-none",
                      selected ? "bg-carbon text-white" : "text-carbon/65 hover:bg-carbon/5"
                    )}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setSection(item.id)}
                  >
                    <Icon className={cn("size-3.5 shrink-0", selected ? "text-white" : "text-zivelo")} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="grid min-h-0 min-w-0 bg-white">
            {section === "profile" ? (
              <ProfileSettings
                avatar={currentAvatar}
                avatarSearch={avatarSearch}
                filteredAvatars={filteredAvatars}
                name={name}
                theme={theme}
                username={username}
                email={user.email}
                hasChanges={hasChanges}
                pending={pending}
                onAvatarChange={setAvatarEmoji}
                onAvatarSearchChange={setAvatarSearch}
                onNameChange={setName}
                onThemeChange={setTheme}
                onUsernameChange={setUsername}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <SecuritySettings />
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileSettings({
  avatar,
  avatarSearch,
  filteredAvatars,
  name,
  theme,
  username,
  email,
  hasChanges,
  pending,
  onAvatarChange,
  onAvatarSearchChange,
  onNameChange,
  onThemeChange,
  onUsernameChange,
  onSave,
  onCancel,
}: {
  avatar: { key: string; name: string; emoji: string; background: string } | null;
  avatarSearch: string;
  filteredAvatars: typeof avatars;
  name: string;
  theme: ThemeValue;
  username: string;
  email: string;
  hasChanges: boolean;
  pending: boolean;
  onAvatarChange: (value: string) => void;
  onAvatarSearchChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onThemeChange: (value: ThemeValue) => void;
  onUsernameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="flex min-h-0 flex-col items-center overflow-y-auto px-5 py-[22px]">
        <div className="flex w-full max-w-[360px] flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-[72px] rounded-full shadow-[0_6px_16px_rgba(29,29,27,0.14)]">
              {avatar ? (
                <AvatarFallback className="text-2xl" style={{ backgroundColor: avatar.background }}>
                  {avatar.emoji}
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-carbon text-lg font-semibold text-white">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="mb-[7px] mt-0 text-xs font-bold uppercase tracking-[0.05em] text-[#9a9a98]">
                Avatar · {avatar ? avatar.name : "Sin avatar"}
              </p>
              <Popover open={avatarPopoverOpen} onOpenChange={setAvatarPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-[34px] rounded-full bg-white px-3.5 text-[13px]">
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Cambiar avatar
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[min(420px,calc(100vw-32px))] rounded-[18px] p-4">
                  <PopoverHeader>
                    <PopoverTitle>Elegir avatar</PopoverTitle>
                    <PopoverDescription>Selecciona una imagen para tu perfil.</PopoverDescription>
                  </PopoverHeader>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-carbon/40" aria-hidden="true" />
                    <Input
                      value={avatarSearch}
                      onChange={(event) => onAvatarSearchChange(event.target.value)}
                      placeholder="Buscar avatar..."
                      className="h-10 pl-9"
                    />
                  </div>
                  <div className="mt-4 grid max-h-[300px] grid-cols-4 gap-x-3 gap-y-4 overflow-auto pr-1">
                    {filteredAvatars.map((option) => {
                      const selected = !!avatar && option.key === avatar.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          className="flex min-w-0 flex-col items-center gap-2 rounded-xl p-1 text-center transition-colors hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/25"
                          onClick={() => { onAvatarChange(option.emoji); setAvatarPopoverOpen(false); }}
                        >
                          <span
                            className={cn(
                              "relative grid size-[66px] place-items-center rounded-full border-[2.5px] text-2xl shadow-[0_6px_16px_rgba(29,29,27,0.10)]",
                              selected ? "border-zivelo" : "border-transparent"
                            )}
                            style={{ backgroundColor: option.background }}
                          >
                            {option.emoji}
                            {selected ? (
                              <span className="absolute -right-1 -top-1 grid size-[22px] place-items-center rounded-full bg-zivelo text-white ring-2 ring-paper">
                                <Check className="size-3" aria-hidden="true" />
                              </span>
                            ) : null}
                          </span>
                          <span className={cn("w-full truncate text-[11.5px] font-semibold", selected ? "text-carbon" : "text-carbon/55")}>
                            {option.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {filteredAvatars.length === 0 ? (
                    <p className="m-0 mt-3 rounded-xl border border-dashed border-carbon/15 p-5 text-center text-sm text-carbon/55">
                      No se encontraron avatares.
                    </p>
                  ) : null}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          <FieldGroup className="gap-[15px]">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="settings-name" className="text-xs font-semibold text-[#454543]">Nombre</FieldLabel>
              <Input id="settings-name" value={name} onChange={(event) => onNameChange(event.target.value)} className="h-10 rounded-[11px] bg-white text-[13.5px]" />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="settings-username" className="text-xs font-semibold text-[#454543]">Username</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13.5px] text-carbon/40">@</span>
                <Input
                  id="settings-username"
                  value={username}
                  onChange={(event) => onUsernameChange(event.target.value)}
                  className="h-10 rounded-[11px] bg-white pl-7 font-mono text-[13px]"
                />
              </div>
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="settings-email" className="items-center text-xs font-semibold text-[#454543]">
                Correo electrónico
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4DE] px-2 py-0.5 text-[10px] font-semibold text-[#7A5A12]">
                  <Mail className="size-2.5" aria-hidden="true" />
                  Gestionado por auth
                </span>
              </FieldLabel>
              <Input id="settings-email" value={email} disabled className="h-10 rounded-[11px] bg-[#F5F5F4] text-[13.5px]" />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold text-[#454543]">Tema</FieldLabel>
              <ThemeSegmentedControl value={theme} onValueChange={onThemeChange} />
            </Field>
          </FieldGroup>
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-carbon/[0.08] bg-[#FCFCFB] px-5 py-[15px] sm:flex-row sm:items-center">
        {hasChanges ? (
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-zivelo sm:mr-auto">
            <span className="size-[7px] rounded-full bg-zivelo" aria-hidden="true" />
            Cambios sin guardar
          </span>
        ) : null}
        <div className="flex gap-2 sm:ml-auto">
          <Button type="button" variant="outline" size="sm" className="h-[38px] flex-1 rounded-[11px] bg-white text-[13px] sm:flex-none" onClick={onCancel}>
            <X className="size-3.5" aria-hidden="true" />
            Cancelar
          </Button>
          <Button type="button" size="sm" className="h-[38px] flex-1 rounded-[11px] text-[13px] sm:flex-none" disabled={pending} onClick={onSave}>
            {pending ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Check className="size-3.5" />
            )}
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function SecuritySettings() {
  const [keyName, setKeyName] = useState("Zibot production key");
  const [agent, setAgent] = useState("zibot");
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; agent: string; token: string }>>([]);
  const [createdKey, setCreatedKey] = useState<{ id: string; name: string; agent: string; token: string } | null>(null);
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false);

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="flex min-h-0 flex-col items-center overflow-y-auto px-5 py-[22px]">
        <div className="flex w-full max-w-[360px] flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-tintred text-zivelo">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="m-0 text-[15px] font-bold text-carbon">Crear API key</h3>
              <p className="m-0 mt-1 text-[12.5px] leading-5 text-carbon/55">Genera una llave para un agente autorizado.</p>
            </div>
          </div>

          <Separator />

          <FieldGroup className="gap-[15px]">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="api-key-name" className="text-xs font-semibold text-[#454543]">Nombre de la llave</FieldLabel>
              <Input id="api-key-name" value={keyName} onChange={(event) => setKeyName(event.target.value)} className="h-10 rounded-[11px] bg-white text-[13.5px]" />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold text-[#454543]">Agente</FieldLabel>
              <UserPicker users={agents} value={agent} onValueChange={setAgent} label="Agente" />
            </Field>
          </FieldGroup>

          <Separator />

          <section className="rounded-[14px] border border-dashed border-carbon/15 bg-carbon/[0.02] p-4 transition-all duration-200">
            <p className="m-0 text-[13px] font-bold text-carbon">API keys configuradas</p>
            {apiKeys.length ? (
              <div className="mt-3 flex flex-col gap-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-carbon/10 bg-white px-3 py-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-tintred text-zivelo">
                      <KeyRound className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-carbon">{key.name}</span>
                      <span className="block truncate font-mono text-[11px] text-carbon/45">{key.agent} · {key.token}••••</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Eliminar ${key.name}`}
                      className="shrink-0 rounded-full text-carbon/45 hover:text-zivelo"
                      onClick={() => {
                        setApiKeys((current) => current.filter((k) => k.id !== key.id));
                        if (createdKey?.id === key.id) {
                          setCreatedKey(null);
                          setKeyPopoverOpen(false);
                        }
                        toast.success("API key eliminada");
                      }}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 mt-2 text-[12.5px] leading-5 text-carbon/55">
                Sin API keys configuradas.
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="relative flex justify-end border-t border-carbon/[0.08] bg-[#FCFCFB] px-5 py-[15px]">
        {keyPopoverOpen && <div className="fixed inset-0 z-40 bg-carbon/35 backdrop-blur-[2px]" aria-hidden="true" />}
        <Popover open={keyPopoverOpen} onOpenChange={setKeyPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="h-[38px] rounded-[11px] text-[13px]"
              onClick={() => {
                const suffix = Math.random().toString(16).slice(2, 8);
                const nextKey = { id: crypto.randomUUID(), name: keyName.trim() || "API key", agent, token: `zaf_${suffix}f2a19e77c4b9a3` };
                setApiKeys((current) => [nextKey, ...current]);
                setCreatedKey(nextKey);
                setKeyPopoverOpen(true);
                toast.success("API key creada");
              }}
            >
              <KeyRound className="size-3.5" aria-hidden="true" />
              Crear API key
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="z-50 w-[min(360px,calc(100vw-32px))] rounded-[18px] p-4">
            <PopoverHeader>
              <PopoverTitle>API key creada</PopoverTitle>
              <PopoverDescription>Cópiala ahora. Después no volverá a mostrarse completa.</PopoverDescription>
            </PopoverHeader>
            <div className="mt-3 rounded-xl border border-carbon/10 bg-[#FAFAF9] p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] text-carbon/45">{createdKey?.name ?? "API key"}</p>
              <code className="mt-2 block overflow-x-auto whitespace-nowrap font-mono text-[12px] text-carbon">
                {createdKey?.token ?? ""}
              </code>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9 rounded-[10px] bg-white text-[13px]" onClick={() => setKeyPopoverOpen(false)}>
                Cerrar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-[10px] text-[13px]"
                disabled={!createdKey}
                onClick={() => createdKey ? copyText(createdKey.token) : undefined}
              >
                <Copy className="size-3.5" aria-hidden="true" />
                Copiar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </footer>
    </div>
  );
}

function ThemeSegmentedControl({ value, onValueChange }: { value: ThemeValue; onValueChange: (value: ThemeValue) => void }) {
  return (
    <div className="flex gap-0.5 rounded-[12px] bg-[#F1F0EE] p-[3px]" role="group" aria-label="Seleccionar tema">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carbon/25",
              selected ? "bg-white font-bold text-carbon shadow-[0_1px_3px_rgba(29,29,27,0.10)]" : "font-medium text-carbon/60 hover:text-carbon"
            )}
            aria-pressed={selected}
            onClick={() => onValueChange(option.value)}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}
