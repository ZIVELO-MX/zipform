"use client";

export function DetailPropertyRow({ label, display, editing, onEdit, children, readOnly = false }: {
  label: string;
  display: React.ReactNode;
  editing: boolean;
  onEdit: (editing: boolean) => void;
  children: React.ReactNode;
  readOnly?: boolean;
}) {
  if (editing) return <div className="rounded-lg bg-[#F7F7F5] px-2 py-2"><label className="mb-1.5 block text-xs font-medium text-[#9A9A98]">{label}</label>{children}</div>;
  if (readOnly) return <div className="grid min-h-10 w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5 px-2"><span className="text-xs font-medium text-[#9A9A98]">{label}</span><span className="min-w-0 truncate text-[12.5px] font-semibold text-[#1D1D1B]">{display}</span></div>;
  return <button type="button" className="grid min-h-10 w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5 rounded-lg px-2 text-left transition-colors hover:bg-[#F7F7F5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1D1D1B]/20" onClick={() => onEdit(true)}><span className="text-xs font-medium text-[#9A9A98]">{label}</span><span className="min-w-0 truncate text-[12.5px] font-semibold text-[#1D1D1B]">{display}</span></button>;
}
