"use client";

export type EntityColumn<T> = {
  id: string;
  label: string;
  align?: "left" | "right";
  render: (item: T) => React.ReactNode;
};

export function EntityTable<T extends { id: string }>({ items, columns, onSelect, minWidth = 920 }: {
  items: T[];
  columns: EntityColumn<T>[];
  onSelect?: (item: T) => void;
  minWidth?: number;
}) {
  return <div className="overflow-x-auto" style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "14px" }}>
    <div style={{ minWidth }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
      <thead><tr style={{ textAlign: "left" }}>{columns.map((column) => <th key={column.id} className="tloz-th" style={{ padding: "11px 14px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "#9a9a98", borderBottom: "1px solid rgba(29,29,27,0.10)", textAlign: column.align ?? "left" }}>{column.label}</th>)}</tr></thead>
      <tbody>{items.map((item) => <tr key={item.id} className="tloz-trow" style={{ cursor: onSelect ? "pointer" : undefined, borderBottom: "1px solid rgba(29,29,27,0.06)" }} onClick={() => onSelect?.(item)}>{columns.map((column) => <td key={column.id} style={{ padding: "11px 14px", textAlign: column.align ?? "left" }}>{column.render(item)}</td>)}</tr>)}</tbody>
    </table>
    </div>
  </div>;
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
    <div style={{ background: "#fff", border: "1px solid rgba(29,29,27,0.10)", borderRadius: "14px", overflow: "hidden" }}>{items.map((item, index) => <button key={item.id} type="button" className="tloz-lrow flex w-full items-center gap-3 px-4 py-[13px] text-left" style={{ borderBottom: index === items.length - 1 ? "none" : "1px solid rgba(29,29,27,0.06)" }} onClick={() => onSelect?.(item)}>{render(item)}</button>)}</div>
  </div>;
}
