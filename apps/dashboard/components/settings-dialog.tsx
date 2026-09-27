"use client";

import {
  Check,
  Copy,
  KeyRound,
  Mail,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  PopoverAnchor,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  UserPicker,
  cn,
  toast,
} from "@tloz/ui";
import type { ApiKey, Avatar as AvatarType, UserProfile } from "@tloz/types";
import { createAgentApiKey, createOwnApiKey, listAgentApiKeys, listAgents, listAvatars, listOwnApiKeys, revokeAgentApiKey, revokeOwnApiKey } from "../lib/settings-actions";
import type { CreateApiKeyResult } from "../lib/settings-actions";
import { updateProfile } from "../lib/settings-actions";
import { useTlozCapabilities } from "./tloz/tloz-capabilities";
import { tlozErrorMessage } from "../lib/tloz-error";

type SettingsSection = "profile" | "security";

const sections: Array<{ id: SettingsSection; label: string; icon: LucideIcon }> = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
];

export function SettingsDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
}) {
  const capabilities = useTlozCapabilities();
  const [section, setSection] = useState<SettingsSection>("profile");
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [avatarSearch, setAvatarSearch] = useState("");
  const [avatars, setAvatars] = useState<AvatarType[]>([]);
  const [pending, startTransition] = useTransition();
  const [securityPending, setSecurityPending] = useState(false);
  const savingProfile = useRef(false);
  const busy = pending || securityPending;

  useEffect(() => {
    if (!open) return;
    let active = true;
    listAvatars().then((items) => { if (active) setAvatars(items); }).catch((error) => { if (active) toast.error(tlozErrorMessage(error, "Error al cargar avatares")); });
    return () => { active = false; };
  }, [open]);

  const currentAvatar = avatars.find((a) => a.imageUrl && a.imageUrl === avatarUrl) ?? null;
  const filteredAvatars = avatars.filter((a) =>
    a.name.toLocaleLowerCase("es").includes(avatarSearch.trim().toLocaleLowerCase("es"))
  );

  const hasChanges = name !== user.name || username !== user.username || avatarUrl !== (user.avatarUrl || "");

  const handleSave = useCallback(() => {
    if (savingProfile.current || !hasChanges || !name.trim() || !username.trim()) return;
    savingProfile.current = true;
    startTransition(async () => {
      try {
        await updateProfile({ name, username, avatarUrl: avatarUrl || undefined });
        toast.success("Perfil actualizado");
        onOpenChange(false);
      } catch (error) {
        toast.error(tlozErrorMessage(error, "Error al guardar los cambios"));
      } finally {
        savingProfile.current = false;
      }
    });
  }, [name, username, avatarUrl, hasChanges, onOpenChange]);

  const handleCancel = useCallback(() => {
    if (busy) return;
    setName(user.name);
    setUsername(user.username);
    setAvatarUrl(user.avatarUrl || "");
    onOpenChange(false);
  }, [busy, onOpenChange, user]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent aria-busy={busy} title="Configuración" className="grid h-[min(680px,calc(100dvh-2rem))] max-w-[620px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 md:grid-rows-[minmax(0,1fr)]">
        <header className="flex items-center justify-between border-b border-carbon/[0.08] px-5 py-[17px] md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-tintred text-zivelo">
              <Settings className="size-4" aria-hidden="true" />
            </span>
            <h1 className="m-0 truncate text-base font-bold text-carbon">Configuración</h1>
          </div>
          <Button type="button" variant="outline" size="icon-xs" aria-label="Cerrar" disabled={busy} className="rounded-full bg-white" onClick={handleCancel}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] bg-[#FCFCFB] md:grid-rows-1 md:grid-cols-[142px_minmax(0,1fr)]">
          <aside className="border-b border-carbon/[0.08] bg-[#FAFAF9] p-2.5 md:flex md:flex-col md:border-b-0 md:border-r md:pt-5">
            <nav className="flex gap-2 md:flex-col" aria-label="Secciones de configuración">
              {sections.filter((item) => item.id !== "security" || capabilities.canManageAgents || capabilities.canManageOwnApiKeys).map((item) => {
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
                    disabled={busy}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setSection(item.id)}
                  >
                    <Icon className={cn("size-3.5 shrink-0", selected ? "text-white" : "text-zivelo")} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <Button type="button" variant="ghost" size="sm" className="mt-auto hidden md:flex" disabled={busy} onClick={handleCancel}>Cerrar configuración</Button>
          </aside>

          <main className="grid min-h-0 min-w-0 bg-white">
            {section === "profile" ? (
              <ProfileSettings
                currentAvatar={currentAvatar}
                avatarUrl={avatarUrl}
                avatars={avatars}
                avatarSearch={avatarSearch}
                filteredAvatars={filteredAvatars}
                name={name}
                username={username}
                email={user.email}
                hasChanges={hasChanges}
                pending={pending}
                onAvatarChange={setAvatarUrl}
                onAvatarSearchChange={setAvatarSearch}
                onNameChange={setName}
                onUsernameChange={setUsername}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <SecuritySettings currentUser={user} onPendingChange={setSecurityPending} />
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileSettings({
  currentAvatar,
  avatarUrl,
  avatars,
  avatarSearch,
  filteredAvatars,
  name,
  username,
  email,
  hasChanges,
  pending,
  onAvatarChange,
  onAvatarSearchChange,
  onNameChange,
  onUsernameChange,
  onSave,
  onCancel,
}: {
  currentAvatar: AvatarType | null;
  avatarUrl: string;
  avatars: AvatarType[];
  avatarSearch: string;
  filteredAvatars: AvatarType[];
  name: string;
  username: string;
  email: string;
  hasChanges: boolean;
  pending: boolean;
  onAvatarChange: (value: string) => void;
  onAvatarSearchChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarTempId, setAvatarTempId] = useState(currentAvatar?.id ?? avatars[0]?.id ?? "");
  const tempAvatar = avatars.find((a) => a.id === avatarTempId);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(); }} className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="flex min-h-0 flex-col items-center overflow-y-auto px-5 py-[22px]">
        <div className="flex w-full max-w-[360px] flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-[72px] rounded-full shadow-[0_6px_16px_rgba(29,29,27,0.14)]">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={currentAvatar?.name ?? "Avatar del perfil"} />
              ) : null}
              <AvatarFallback className="bg-carbon text-lg font-semibold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="mb-[7px] mt-0 text-xs font-bold uppercase tracking-[0.05em] text-[#9a9a98]">
                Avatar · {currentAvatar ? currentAvatar.name : "Sin avatar"}
              </p>
              <Button type="button" variant="outline" size="sm" className="h-[34px] rounded-full bg-white px-3.5 text-[13px]" disabled={pending} onClick={() => { setAvatarTempId(currentAvatar?.id ?? avatars[0]?.id ?? ""); setAvatarPickerOpen(true); }}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Cambiar avatar
              </Button>

              <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
                <DialogContent title="Elegir avatar" className="flex max-w-[460px] flex-col gap-0 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-start justify-between px-5 pb-[6px] pt-[17px]">
                    <div>
                      <h3 className="m-0 text-base font-bold">Elegir avatar</h3>
                      <p className="m-0 mt-1 text-[12.5px] text-carbon/55">Selecciona una imagen para tu perfil.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAvatarPickerOpen(false)}
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-carbon/12 bg-white text-carbon/55 transition-colors hover:border-zivelo hover:text-zivelo"
                      aria-label="Cerrar"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-5 py-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-carbon/40" />
                      <Input
                        value={avatarSearch}
                        aria-label="Buscar avatar"
                        onChange={(event) => onAvatarSearchChange(event.target.value)}
                        placeholder="Buscar avatar..."
                        className="h-10 pl-9"
                      />
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="max-h-[300px] min-h-0 flex-1 overflow-y-auto px-5 pb-2">
                    {filteredAvatars.length > 0 ? (
                      <div className="grid grid-cols-3 gap-x-3 gap-y-4 py-2 sm:grid-cols-4">
                        {filteredAvatars.map((option) => {
                          const selected = option.id === avatarTempId;
                          return (
                            <Tooltip key={option.id}>
                            <TooltipTrigger asChild><button
                              type="button"
                              aria-label={option.name}
                              aria-pressed={selected}
                              className="group relative flex flex-col items-center gap-[7px] rounded-full border-none bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zivelo"
                              onClick={() => setAvatarTempId(option.id)}
                            >
                              <div
                                className={cn(
                                  "relative size-[66px] rounded-full border-[2.5px] transition-all duration-150",
                                  selected
                                    ? "border-zivelo shadow-[0_0_0_3px_rgba(215,34,40,0.18)]"
                                    : "border-carbon/10 shadow-[0_2px_8px_rgba(29,29,27,0.10)] group-hover:border-zivelo/50"
                                )}
                              >
                                {option.imageUrl ? (
                                  <Avatar className="size-full rounded-full">
                                    <AvatarImage src={option.imageUrl} alt="" className="size-full object-cover" />
                                    <AvatarFallback className="bg-carbon/5 text-sm font-semibold text-carbon/70">{option.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <span className="flex size-full items-center justify-center rounded-full bg-carbon/10 text-sm font-semibold text-carbon/45">
                                    ?
                                  </span>
                                )}
                                {selected && (
                                  <span className="absolute -right-[5px] -top-[5px] grid size-[22px] place-items-center rounded-full bg-zivelo text-white ring-2 ring-paper">
                                    <Check className="size-3" aria-hidden="true" />
                                  </span>
                                )}
                              </div>
                            </button></TooltipTrigger>
                            <TooltipContent side="top">{option.name}</TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-[10px] py-[38px] text-center">
                        <span className="grid size-11 place-items-center rounded-xl bg-carbon/5 text-carbon/45">
                          <Search className="size-5" />
                        </span>
                        <div className="text-[13.5px] font-medium text-carbon/55">No se encontraron avatares.</div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-carbon/[0.08] bg-[#FCFCFB] px-5 py-[14px]">
                    <span className="text-[12.5px] text-carbon/55">
                      Seleccionado: <b className="font-bold text-carbon">{tempAvatar?.name ?? ""}</b>
                    </span>
                    <div className="flex gap-[9px]">
                      <Button type="button" variant="outline" size="sm" className="h-[38px] rounded-[11px] bg-white px-[15px] text-[13px]" onClick={() => setAvatarPickerOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" disabled={!tempAvatar} className="h-[38px] rounded-[11px] px-[17px] text-[13px] shadow-[0_10px_22px_rgba(215,34,40,0.20)]" onClick={() => { const s = avatars.find((a) => a.id === avatarTempId); if (s) onAvatarChange(s.imageUrl); setAvatarPickerOpen(false); }}>
                        Usar avatar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Separator />

          <FieldGroup className="gap-[15px]">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="settings-name" className="text-xs font-semibold text-[#454543]">Nombre</FieldLabel>
              <Input disabled={pending} id="settings-name" value={name} onChange={(event) => onNameChange(event.target.value)} className="h-10 rounded-[11px] bg-white text-[13.5px]" />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="settings-username" className="text-xs font-semibold text-[#454543]">Username</FieldLabel>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13.5px] text-carbon/40">@</span>
                <Input
                  disabled={pending}
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
                  No editable
                </span>
              </FieldLabel>
              <Input id="settings-email" value={email} disabled className="h-10 rounded-[11px] bg-[#F5F5F4] text-[13.5px]" />
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
          <Button type="button" variant="outline" size="sm" className="h-[38px] flex-1 rounded-[11px] bg-white text-[13px] sm:flex-none" disabled={pending} onClick={onCancel}>
            <X className="size-3.5" aria-hidden="true" />
            Cancelar
          </Button>
          <Button type="submit" size="sm" className="h-[38px] flex-1 rounded-[11px] text-[13px] sm:flex-none" disabled={pending || !hasChanges || !name.trim() || !username.trim()}>
            {pending ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Check className="size-3.5" />
            )}
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </footer>
    </form>
  );
}

function SecuritySettings({ currentUser, onPendingChange }: { currentUser: UserProfile; onPendingChange: (pending: boolean) => void }) {
  const capabilities = useTlozCapabilities();
  const [keyName, setKeyName] = useState("Personal TLOZ key");
  const [agent, setAgent] = useState(currentUser.id);
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResult | null>(null);
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false);
  const [operation, setOperation] = useState<"create" | "revoke" | null>(null);
  const pending = operation !== null;
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const mutating = useRef(false);

  function beginMutation(nextOperation: "create" | "revoke") {
    if (mutating.current) return false;
    mutating.current = true;
    setOperation(nextOperation);
    onPendingChange(true);
    return true;
  }

  function endMutation() {
    mutating.current = false;
    setOperation(null);
    onPendingChange(false);
  }

  useEffect(() => {
    if (!capabilities.canManageAgents) return;
    listAgents().then(setAgents).catch((error) => toast.error(tlozErrorMessage(error, "No tienes permiso para administrar agentes")));
  }, [capabilities.canManageAgents]);

  useEffect(() => {
    let active = true;
    setApiKeys([]);
    setKeysLoading(true);
    setKeysError(null);
    setCreatedKey(null);
    setKeyPopoverOpen(false);
    const request = agent === currentUser.id ? listOwnApiKeys() : listAgentApiKeys(agent);
    request.then((keys) => { if (active) setApiKeys(keys); }).catch((error) => {
      if (active) setKeysError(tlozErrorMessage(error, "No se pudieron cargar las API keys."));
    }).finally(() => { if (active) setKeysLoading(false); });
    return () => { active = false; };
  }, [agent, currentUser.id]);

  const agentOptions = [
    { id: currentUser.id, name: "Mi cuenta", username: currentUser.username, avatarUrl: currentUser.avatarUrl },
    ...agents.map((a) => ({ id: a.id, name: a.name, username: a.username, avatarUrl: a.avatarUrl })),
  ];

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
              <p className="m-0 mt-1 text-[12.5px] leading-5 text-carbon/55">Genera una llave para tu cuenta o un agente autorizado.</p>
            </div>
          </div>

          <Separator />

          <FieldGroup className="gap-[15px]">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="api-key-name" className="text-xs font-semibold text-[#454543]">Nombre de la llave</FieldLabel>
              <Input disabled={pending} id="api-key-name" value={keyName} onChange={(event) => setKeyName(event.target.value)} className="h-10 rounded-[11px] bg-white text-[13.5px]" />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold text-[#454543]">Cuenta</FieldLabel>
              <UserPicker users={agentOptions} value={agent} disabled={pending} onValueChange={setAgent} label="Cuenta" />
            </Field>
          </FieldGroup>

          <Separator />

          <section className="rounded-[14px] border border-dashed border-carbon/15 bg-carbon/[0.02] p-4 transition-all duration-200">
            <p className="m-0 text-[13px] font-bold text-carbon">API keys configuradas</p>
            {keysLoading ? <p className="mt-2 text-xs text-carbon/65" role="status">Cargando API keys…</p> : keysError ? <p className="mt-2 text-xs text-zivelo" role="alert">{keysError}</p> : apiKeys.length ? (
              <div className="mt-3 flex flex-col gap-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-carbon/10 bg-white px-3 py-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-tintred text-zivelo">
                      <KeyRound className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-carbon">{key.name}</span>
                      <span className="block truncate font-mono text-[11px] text-carbon/45">{key.keyPrefix}••••</span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={pending}
                      aria-label={`Eliminar ${key.name}`}
                      className="shrink-0 rounded-full text-carbon/45 hover:text-zivelo"
                      onClick={async () => {
                        if (!beginMutation("revoke")) return;
                        try {
                          if (agent === currentUser.id) await revokeOwnApiKey(key.id);
                          else await revokeAgentApiKey(agent, key.id);
                          setApiKeys((current) => current.filter((k) => k.id !== key.id));
                          if (createdKey?.apiKey.id === key.id) {
                            setCreatedKey(null);
                            setKeyPopoverOpen(false);
                          }
                          toast.success("API key eliminada");
                        } catch (error) {
                          toast.error(tlozErrorMessage(error, "Error al eliminar API key"));
                        } finally {
                          endMutation();
                        }
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
        <Popover open={keyPopoverOpen} onOpenChange={(open) => { setKeyPopoverOpen(open); if (!open) setCreatedKey(null); }}>
          <PopoverAnchor asChild>
            <Button
              type="button"
              size="sm"
              className="h-[38px] rounded-[11px] text-[13px]"
              disabled={pending || keysLoading || !agent}
              onClick={async () => {
                if (!beginMutation("create")) return;
                try {
                  const result = agent === currentUser.id
                    ? await createOwnApiKey(keyName.trim() || "API key")
                    : await createAgentApiKey(agent, keyName.trim() || "API key");
                  setApiKeys((current) => [result.apiKey, ...current]);
                  setCreatedKey(result);
                  setKeyPopoverOpen(true);
                  toast.success("API key creada");
                } catch (error) {
                  toast.error(tlozErrorMessage(error, "Error al crear API key"));
                } finally {
                  endMutation();
                }
              }}
            >
              <KeyRound className="size-3.5" aria-hidden="true" />
              {operation === "create" ? "Creando…" : "Crear API key"}
            </Button>
          </PopoverAnchor>
          <PopoverContent align="end" side="top" className="z-50 w-[min(360px,calc(100vw-32px))] rounded-[18px] p-4">
            <PopoverHeader>
              <PopoverTitle>API key creada</PopoverTitle>
              <PopoverDescription>Cópiala ahora. Después no volverá a mostrarse completa.</PopoverDescription>
            </PopoverHeader>
            <div className="mt-3 rounded-xl border border-carbon/10 bg-[#FAFAF9] p-3">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.04em] text-carbon/45">{createdKey?.apiKey.name ?? "API key"}</p>
              <code className="mt-2 block overflow-x-auto whitespace-nowrap font-mono text-[12px] text-carbon">
                {createdKey?.key ?? ""}
              </code>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="h-9 rounded-[10px] bg-white text-[13px]" onClick={() => { setKeyPopoverOpen(false); setCreatedKey(null); }}>
                Cerrar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-[10px] text-[13px]"
                disabled={!createdKey}
                onClick={() => createdKey ? copyText(createdKey.key) : undefined}
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

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("API key copiada");
  } catch {
    toast.error("No se pudo copiar. Selecciona la llave y cópiala manualmente.");
  }
}
