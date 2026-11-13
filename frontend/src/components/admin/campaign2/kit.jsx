"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { errText } from "@/lib/supabase";

/**
 * Campaign workspace (payments, messages, attribution, report, bulk upload) ke chhote common blocks.
 * Sabki CSS yahin inline (<Kit/> style) — har page apna baaki CSS khud rakhta hai.
 */

/* Sub tabs — "📦 Shipping | 💰 Payments" jaisi pills (har ek apna route) */
export function SubTabs({ items, active }) {
  return (
    <nav className="c2-sub" aria-label="Section" data-scroll>
      {items.map((t) => (
        <Link key={t.href} href={t.href} className={`ad-tab ${active === t.k ? "is-on" : ""}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/* Bada white card: title + sub + right side actions */
export function Panel({ title, sub, actions, children, className = "" }) {
  return (
    <section className={`ad-card c2-panel ${className}`}>
      <Kit />
      {(title || actions) && (
        <div className="c2-panel__head">
          <div className="c2-panel__txt">
            {title && <h2 className="ad-h2 c2-panel__title">{title}</h2>}
            {sub && <p className="c2-panel__sub">{sub}</p>}
          </div>
          {actions && <div className="c2-panel__act">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* Rangin patti (amber / red / green) */
export function Note({ tone = "amber", icon, children }) {
  return (
    <div className={`c2-note c2-note--${tone}`}>
      {icon && <span className="c2-note__ic">{icon}</span>}
      <p>{children}</p>
    </div>
  );
}

/* Card ke andar stat boxes (pehla purple) */
export function MiniStats({ items, cols }) {
  return (
    <div className={`c2-stats ${items.some((s) => s.note) ? "" : "c2-stats--short"}`} style={{ "--c2-cols": cols || items.length }}>
      {items.map((s, i) => (
        <div key={i} className={`c2-stat ${i === 0 ? "c2-stat--hero" : ""}`}>
          <strong>{s.value}</strong>
          <span>{s.label}</span>
          {s.note && <small>{s.note}</small>}
        </div>
      ))}
    </div>
  );
}

/* Toast — 2.4s baad apne aap gayab */
export function useToast() {
  const [msg, setMsg] = useState("");
  const t = useRef(null);
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(""), 2400);
  }, []);
  useEffect(() => () => clearTimeout(t.current), []);
  const node = msg ? (
    <div className="ad-toast" role="status">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

/* Clipboard copy (fail ho to bhi chupchap) */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* rows → CSV file download (Excel bhi khol leta hai) */
export function downloadFile(name, rows) {
  try {
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* ignore */
  }
}

/* Link jaisa button (Figma: purple bold text actions) */
export function TextBtn({ children, onClick, href, className = "" }) {
  if (href)
    return (
      <Link href={href} className={`c2-tbtn ${className}`}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={`c2-tbtn ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

/* Table ke andar loading / error / khaali — ek hi row (Figma style) */
export function TableState({ cols, loading, error, empty, onRetry }) {
  if (!loading && !error && !empty) return null;
  return (
    <tr>
      <td colSpan={cols} className="c2-state">
        {loading ? (
          <span className="c2-skel" aria-label="Loading">Loading…</span>
        ) : error ? (
          <>
            {errText(error)}{" "}
            {onRetry && (
              <button type="button" className="c2-tbtn" onClick={() => onRetry()}>
                Retry
              </button>
            )}
          </>
        ) : (
          empty
        )}
      </td>
    </tr>
  );
}

/* Card ke bahar ka loading / error (poora panel) */
export function BoxState({ loading, error, onRetry }) {
  if (loading) return <p className="c2-state c2-state--box">Loading…</p>;
  if (error)
    return (
      <p className="c2-state c2-state--box">
        {errText(error)}{" "}
        {onRetry && (
          <button type="button" className="c2-tbtn" onClick={() => onRetry()}>
            Retry
          </button>
        )}
      </p>
    );
  return null;
}

/* Number / rupee / date formatting */
export const num = (v) => (v == null || v === "" ? "—" : Number(v).toLocaleString("en-IN"));
export const inr = (v) => (v == null || v === "" ? "—" : "₹" + Math.round(Number(v) || 0).toLocaleString("en-IN"));
export function when(t) {
  if (!t) return "—";
  try {
    return new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return String(t);
  }
}
export function ago(t) {
  if (!t) return "—";
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? m + "m ago" : m < 1440 ? Math.round(m / 60) + "h ago" : Math.round(m / 1440) + "d ago";
}

/* Bahar ki script ek baar (Excel / Word padhne ke liye — purane app jaisa CDN se) */
export function loadScript(src) {
  return new Promise((ok, bad) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement("script");
    s.src = src;
    s.onload = ok;
    s.onerror = () => bad(new Error("Couldn't load the file reader — check your connection."));
    document.head.appendChild(s);
  });
}
export const XLSX_SRC = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
export const MAMMOTH_SRC = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";

/* CSV / TSV text → rows (quotes samajhta hai) */
export function splitCsv(text) {
  const rows = [];
  let row = [],
    cur = "",
    q = false;
  const t = String(text || "").replace(/\r\n?/g, "\n");
  const first = t.split("\n")[0];
  const sep = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? "\t" : ",";
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') {
      q = true;
      continue;
    }
    if (ch === sep) {
      row.push(cur.trim());
      cur = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cur.trim());
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur !== "" || row.length) {
    row.push(cur.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ""));
}

/* Excel / CSV file → rows (array of arrays) */
export async function readSheetFile(file) {
  const name = (file.name || "").toLowerCase();
  if (/\.(xlsx|xls|xlsm|ods)$/.test(name)) {
    await loadScript(XLSX_SRC);
    const wb = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" }).map((r) => r.map((c) => String(c == null ? "" : c).trim())).filter((r) => r.some(Boolean));
  }
  return splitCsv(await file.text());
}

/* rows → Excel file download (purane app jaisa SheetJS) */
export async function downloadXlsx(name, rows, sheet = "Sheet1") {
  await loadScript(XLSX_SRC);
  const ws = window.XLSX.utils.aoa_to_sheet(rows);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, sheet);
  window.XLSX.writeFile(wb, name);
}

export function Kit() {
  return (
    <style>{`
      .c2-sub { display: flex; gap: 8px; margin: -9px 0 17px; overflow-x: auto; scrollbar-width: none; }
      .c2-sub::-webkit-scrollbar { display: none; }
      .c2-sub .ad-tab { height: 36px; flex-shrink: 0; }
      .c2-sub .ad-tab:not(.is-on) { color: #67718a; background: var(--ad-soft-2); }

      .c2-panel { padding: 22px 22px 30px; margin-bottom: 20px; min-width: 0; }
      .c2-panel__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
      .c2-panel__txt { min-width: 0; }
      .c2-panel__title { font-size: 17px; line-height: 1.3; }
      .c2-panel__sub { margin-top: 8px; font-size: 12px; line-height: 1.35; color: var(--ad-muted); }
      .c2-panel__act { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; justify-content: flex-end; padding-top: 6px; }
      .c2-panel__act .ad-btn { height: 43px; padding: 0 16px; }

      .c2-tbtn { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; white-space: nowrap; }
      .c2-tbtn:hover { color: var(--ad-primary-2); }

      .c2-note { display: flex; align-items: flex-start; gap: 10px; padding: 12px 15px; border-radius: 12px; border: 1px solid; font-size: 12px; line-height: 1.33; }
      .c2-note p { margin: 0; flex: 1; min-width: 0; }
      .c2-note b { font-weight: 700; }
      .c2-note__ic { flex-shrink: 0; width: 14px; text-align: center; }
      .c2-note--amber { background: #fff6e6; border-color: #f6dfb4; color: #986016; }
      .c2-note--red { background: #fdedef; border-color: #f4c9cf; color: #b64455; }
      .c2-note--green { background: #e8f8f0; border-color: #b9e6d0; color: #168560; }
      .c2-note a, .c2-note u { text-decoration: underline; color: inherit; cursor: pointer; }

      .c2-stats { display: grid; grid-template-columns: repeat(var(--c2-cols), minmax(0, 1fr)); gap: 12px; }
      .c2-stat { display: flex; flex-direction: column; min-height: 120px; padding: 23px 19px 16px; border-radius: 16px; border: 1px solid var(--ad-line); background: #fff; min-width: 0; }
      .c2-stats--short .c2-stat { min-height: 105px; padding-top: 21px; }
      .c2-stat strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; color: var(--ad-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .c2-stat span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
      .c2-stat small { margin-top: 6px; font-size: 11px; color: var(--ad-faint); }
      .c2-stat--hero { background: var(--ad-grad); border-color: transparent; box-shadow: 0 16px 30px -18px rgba(103,87,245,.9); }
      .c2-stat--hero strong { color: #fff; }
      .c2-stat--hero span, .c2-stat--hero small { color: #e4ddff; }

      /* Table (card ke andar — Figma: no bg header, row lines) */
      .c2-tw { overflow-x: auto; margin: 0 -2px; padding: 0 2px; }
      .c2-t { width: 100%; border-collapse: collapse; font-size: 13px; }
      .c2-t th { padding: 12px 11px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #9aa2b4; border-bottom: 1px solid var(--ad-line); white-space: nowrap; }
      .c2-t td { padding: 14px 11px; border-bottom: 1px solid var(--ad-line); color: var(--ad-ink); vertical-align: middle; white-space: nowrap; }
      .c2-t tr:last-child td { border-bottom: 0; }
      .c2-t b { font-weight: 700; }
      .c2-t .c2-link { font-weight: 800; color: #6151ea; }
      .c2-t .c2-link:hover { color: var(--ad-primary-2); }
      .c2-t td.c2-state, .c2-state { text-align: center; color: var(--ad-muted); white-space: normal; font-size: 13px; }
      .c2-state--box { padding: 26px 0; }
      .c2-skel { display: inline-block; animation: c2Pulse 1.2s ease-in-out infinite; }
      @keyframes c2Pulse { 50% { opacity: .45; } }

      @media (max-width: 1023px) {
        .c2-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }
      @media (max-width: 640px) {
        .c2-panel { padding: 18px 16px 20px; }
        .c2-panel__head { flex-direction: column; gap: 10px; }
        .c2-panel__act { justify-content: flex-start; gap: 10px 16px; padding-top: 0; }
        .c2-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .c2-stat, .c2-stats--short .c2-stat { min-height: 0; padding: 16px 14px; }
        .c2-stat strong { font-size: 23px; }
        .c2-tw { margin: 0 -16px; padding: 0 16px; }
        .c2-sub { margin: -6px -16px 14px; padding: 0 16px; }
      }
    `}</style>
  );
}
