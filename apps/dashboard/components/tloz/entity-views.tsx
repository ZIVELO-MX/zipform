"use client";

import { HorizontalScrollArea } from "./horizontal-scroll-area";

export type EntityColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right";
  width?: number;
  sticky?: boolean;
  render: (item: T) => React.ReactNode;
};

export function EntityTable<T extends { id: string }>({ items, columns, onSelect, minWidth = 920 }: {
  items: T[];
  columns: EntityColumn<T>[];
  onSelect?: (item: T) => void;
  minWidth?: number;
}) {
  return <HorizontalScrollArea label="Tabla de elementos" viewportClassName="border border-carbon/10 bg-white">
    <table className="w-full table-fixed border-collapse text-[13px]" style={{ minWidth }}>
      <colgroup>{columns.map((column) => <col key={column.id} style={{ width: column.width }} />)}</colgroup>
      <thead><tr>{columns.map((column) => <th key={column.id} scope="col" className={`border-b border-carbon/10 bg-[#F7F7F6] px-3 py-2.5 text-[11px] font-bold text-carbon/65 ${column.sticky ? "sticky left-0 z-10" : ""}`} style={{ textAlign: column.align ?? "left" }}>{column.label}</th>)}</tr></thead>
      <tbody>{items.map((item) => <tr key={item.id} className="tloz-trow group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zivelo" style={{ cursor: onSelect ? "pointer" : undefined }} tabIndex={onSelect ? 0 : undefined} onClick={() => onSelect?.(item)} onKeyDown={(event) => { if (onSelect && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(item); } }}>{columns.map((column) => <td key={column.id} className={`overflow-hidden border-b border-carbon/5 px-3 py-2.5 ${column.sticky ? "sticky left-0 z-10 bg-white group-hover:bg-[#F7F7F6] group-focus:bg-[#F7F7F6]" : ""}`} style={{ textAlign: column.align ?? "left" }}>{column.render(item)}</td>)}</tr>)}</tbody>
    </table>
  </HorizontalScrollArea>;
}

export function EntityList<T extends { id: string }>({ title, tone = "#9a9a98", items, render, onSelect }: {
  title: string;
  tone?: string;
  items: T[];
  render: (item: T) => React.ReactNode;
  onSelect?: (item: T) => void;
}) {
  return <div className="px-4 md:px-0" style={{ maxWidth: "1180px", margin: "0 auto 16px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "13px 16px 9px" }}><span style={{ width: 9, height: 9, borderRadius: 999, background: tone }} /><span style={{ fontWeight: 700, fontSize: 13 }}>{title}</span><span className="rounded-full bg-carbon/5 px-2 py-0.5 font-mono text-[11px] font-medium text-carbon/65">{items.length}</span></div>
    <div className="tloz-list-cards" style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "14px", overflow: "hidden" }}>{items.map((item, index) => <button key={item.id} type="button" className="tloz-lrow flex w-full items-center gap-3 px-4 py-[13px] text-left" style={{ borderBottom: index === items.length - 1 ? "none" : "1px solid rgba(29,29,27,0.06)" }} onClick={() => onSelect?.(item)}>{render(item)}</button>)}</div>
  </div>;
}
