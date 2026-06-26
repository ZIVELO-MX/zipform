import * as React from "react";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";

export type Tone = {
  color: string;
  background?: string;
};

export function initialsFromName(name: string) {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export type UserAvatarLabelProps = {
  name: string;
  label?: string;
  imageUrl?: string;
  size?: "sm" | "md";
  className?: string;
};

export function UserAvatarLabel({ name, label, imageUrl, size = "md", className }: UserAvatarLabelProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Avatar className={cn("rounded-full", size === "sm" ? "size-5" : "size-7")}>
        <AvatarImage src={imageUrl} alt="" />
        <AvatarFallback className={cn("bg-carbon font-medium text-white", size === "sm" ? "text-[0.5rem]" : "text-[0.65rem]")}>
          {initialsFromName(name)}
        </AvatarFallback>
      </Avatar>
      {label ? <span className="truncate text-carbon/75">{label}</span> : null}
    </span>
  );
}

export type ToneBadgeProps = React.ComponentPropsWithoutRef<typeof Badge> & {
  tone: Tone;
};

export function ToneBadge({ tone, className, style, ...props }: ToneBadgeProps) {
  return (
    <Badge
      className={cn("font-semibold text-white", className)}
      style={{ backgroundColor: tone.color, color: "#fff", ...style }}
      {...props}
    />
  );
}

export type StatusPillProps = React.HTMLAttributes<HTMLSpanElement> & {
  label: string;
  color: string;
  active?: boolean;
};

export function StatusPill({ label, color, active = false, className, style, ...props }: StatusPillProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", className)}
      style={{ color, ...style }}
      {...props}
    >
      <span
        className={cn("size-1.5 rounded-full", active && "animate-pulse")}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export type MetricProgressProps = {
  value: number;
  label?: string;
  tone?: string;
  className?: string;
};

export function MetricProgress({ value, label, tone = "var(--zivelo-red)", className }: MetricProgressProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs text-carbon/65">
          <span>{label}</span>
          <span className="font-mono font-semibold text-carbon">{value}%</span>
        </div>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-carbon/10">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: tone }} />
      </div>
    </div>
  );
}

export type SectionHeadingProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function SectionHeading({ title, subtitle, count, action, icon, className }: SectionHeadingProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="m-0 inline-flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-normal text-carbon/80">
        {icon ? <span className="inline-flex text-zivelo">{icon}</span> : null}
        <span className="truncate">{title}</span>
        {typeof count === "number" ? (
          <span className="rounded-full bg-carbon/5 px-2 py-0.5 font-mono text-[11px] font-medium text-carbon/55">{count}</span>
        ) : null}
        {subtitle ? <span className="font-medium normal-case text-carbon/60">{subtitle}</span> : null}
      </h2>
      {action}
    </div>
  );
}

export type PageSubHeaderProps = {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageSubHeader({ title, description, actions, className }: PageSubHeaderProps) {
  return (
    <div className={cn("flex shrink-0 flex-wrap items-center justify-between gap-4 px-[26px] pb-3.5 pt-4", className)}>
      <div className="min-w-0">
        <h1 className="m-0 truncate text-[21px] font-bold tracking-normal text-carbon">{title}</h1>
        {description ? <p className="m-0 mt-1 text-[13px] text-carbon/65">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type SegmentedControlOption = {
  label: string;
  value: string;
};

export function SegmentedControl({
  options,
  value,
  "aria-label": ariaLabel = "View selector"
}: {
  options: SegmentedControlOption[];
  value: string;
  "aria-label"?: string;
}) {
  return (
    <div className="inline-flex gap-0.5 rounded-full bg-carbon/5 p-0.5" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium text-carbon/65 transition-colors",
            option.value === value && "bg-white font-semibold text-carbon shadow-[0_1px_2px_rgba(29,29,27,0.07)]"
          )}
          disabled={option.value === value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-carbon/15 p-5 text-center text-sm text-carbon/55">
      <strong className="block text-carbon/70">{title}</strong>
      {description ? <span className="mt-1 block">{description}</span> : null}
    </div>
  );
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("rounded-full bg-white", className)}
      aria-label={label}
      {...props}
    >
      {children}
    </Button>
  );
}

export type BoardColumnShellProps = {
  title: string;
  count: number;
  tone: string;
  active?: boolean;
  children: React.ReactNode;
};

export function BoardColumnShell({ title, count, tone, active, children }: BoardColumnShellProps) {
  return (
    <section className="flex max-h-full flex-[0_0_296px] flex-col [contain-intrinsic-size:auto_296px_auto_760px] [content-visibility:auto]">
      <div className="flex items-center gap-2 px-1.5 pb-3 pt-1">
        <span className={cn("size-2 rounded-full", active && "animate-pulse")} style={{ backgroundColor: tone }} aria-hidden="true" />
        <h2 className="m-0 text-[13px] font-bold tracking-normal">{title}</h2>
        <span className="rounded-full bg-carbon/5 px-2 py-0.5 font-mono text-[11px] font-medium text-carbon/65">{count}</span>
      </div>
      <div className="flex min-h-[60px] flex-1 flex-col gap-3 overflow-auto pb-2 pl-0.5 pr-0.5">{children}</div>
    </section>
  );
}
