"use client";

import * as React from "react";
import { Check, Search, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";

export type UserPickerOption = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
};

export function UserPicker({ users, value, onValueChange, label = "Responsable", className }: {
  users: UserPickerOption[];
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selected = users.find((user) => user.id === value);
  const filtered = users.filter((user) => `${user.name} ${user.username ?? ""}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("w-full justify-start [&_svg]:size-3.5", className)} aria-label={`Seleccionar ${label.toLowerCase()}`}>
          {selected ? <UserAvatar user={selected} /> : <UserRound aria-hidden="true" />}
          <span className="min-w-0 truncate text-left">{selected?.username ?? selected?.name ?? `Seleccionar ${label.toLowerCase()}`}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(340px,calc(100vw-32px))]">
        <PopoverHeader>
          <PopoverTitle>Seleccionar {label.toLowerCase()}</PopoverTitle>
        </PopoverHeader>
        <label className="relative block">
          <span className="sr-only">Buscar usuarios</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-carbon/40" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuarios…" className="pl-9" autoComplete="off" />
        </label>
        <div className="mt-2 flex max-h-64 flex-col gap-1 overflow-y-auto overscroll-contain">
          {filtered.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex min-h-11 items-center gap-3 rounded-xl px-2.5 text-left transition-colors hover:bg-carbon/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-carbon/30"
              onClick={() => { onValueChange(user.id); setOpen(false); setQuery(""); }}
            >
              <UserAvatar user={user} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{user.username ?? user.name}</span>
              {value === user.id ? <Check className="size-3.5" aria-hidden="true" /> : null}
            </button>
          ))}
          {filtered.length === 0 ? <p className="m-0 py-6 text-center text-sm text-carbon/50">No se encontraron usuarios.</p> : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UserAvatar({ user }: { user: UserPickerOption }) {
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Avatar className="size-7 rounded-full">
      <AvatarImage src={user.avatarUrl} alt="" />
      <AvatarFallback className="bg-carbon text-[0.6rem] text-white">{initials}</AvatarFallback>
    </Avatar>
  );
}
