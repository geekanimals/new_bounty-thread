"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Reports / Activity / Users / Settings ke common blocks (Figma):
 *  - LinkTabs: page ke andar wale tabs (har tab apna route)
 *  - Panel: white card + title (Manrope 17) + sub + right action
 *  - Table: card ke andar table (columns ki width Figma px se)
 *  - Notice: peela info strip
 *  - useToast + downloadFile (CSV/JSON dummy download)
 */

export const SETTINGS_TABS = [
  { k: "team", label: "👥 Team" },
  { k: "auto-messages", label: "📣 Auto messages" },
  { k: "link-shortener", label: "🔗 Link shortener" },
  { k: "super-admins", label: "🛡 Super admins" },
  { k: "workspaces", label: "🏢 Workspaces" },
  { k: "audit-log", label: "📜 Audit log" },
  { k: "data-browser", label: "🗄 Data browser" },
  { k: "system-check", label: "🩺 System check" },
  { k: "delete-requests", label: "🗑 Delete requests" },
];

export const REPORT_TABS = [
  { href: "/admin/reports", label: "Campaign performance" },
  { href: "/admin/reports/traits", label: "🧩 Creator traits" },
];

export function LinkTabs({ tabs }) {
  const pathname = usePathname() || "";
  return (
    <nav className="sk-tabs" data-scroll>
      {tabs.map((t) => {
        const on = t.match ? t.match(pathname) : pathname === t.href;
        return (
          <Link key={t.href} href={t.href} className={`ad-tab ${on ? "is-on" : ""}`} aria-current={on ? "page" : undefined}>
            {t.label}
          </Link>
        );
      })}
      <style>{`
        .sk-tabs { display: flex; flex-wrap: wrap; gap: 7px 7px; margin: 1px 0 16px; }
        .sk-tabs .ad-tab { height: 37px; padding: 0 14px; }
        .sk-tabs .ad-tab:not(.is-on) { color: #67718a; }
        .sk-tabs .ad-tab:not(.is-on):hover { background: var(--ad-lilac); color: var(--ad-primary-2); }
        @media (max-width: 640px) {
          .sk-tabs { flex-wrap: nowrap; overflow-x: auto; margin: 0 -16px 16px; padding: 0 16px; scrollbar-width: none; }
          .sk-tabs::-webkit-scrollbar { display: none; }
          .sk-tabs .ad-tab { flex-shrink: 0; }
        }
      `}</style>
    </nav>
  );
}

export function SettingsTabs() {
  return (
    <LinkTabs
      tabs={SETTINGS_TABS.map((t) => ({
        href: `/admin/settings/${t.k}`,
        label: t.label,
        match: (p) => p === `/admin/settings/${t.k}` || (t.k === "team" && p === "/admin/settings"),
      }))}
    />
  );
}

export function Panel({ title, sub, action, children, className = "" }) {
  return (
    <section className={`ad-card sk-panel ${className}`}>
      {(title || action) && (
        <div className="sk-panel__head">
          <div className="sk-panel__txt">
            {title && <h2 className="ad-h2">{title}</h2>}
            {sub && <p className="sk-panel__sub">{sub}</p>}
          </div>
          {action && <div className="sk-panel__act">{action}</div>}
        </div>
      )}
      {children}
      <style>{`
        .sk-panel { padding: 22px 22px 30px; margin-bottom: 19px; }
        .sk-panel__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
        .sk-panel__txt { min-width: 0; }
        .sk-panel .ad-h2 { line-height: 1.35; }
        .sk-panel__sub { margin-top: 6px; font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
        .sk-panel__act { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .sk-panel__act .ad-btn { height: 40px; }
        @media (max-width: 640px) {
          .sk-panel { padding: 18px 16px 20px; }
          .sk-panel__head { flex-wrap: wrap; }
        }
      `}</style>
    </section>
  );
}

/**
 * cols: [{ label, w }] — w = Figma mein column ki chaudai (px). Total 1076 = poori table.
 * rows: array of arrays (cells = node). rowH: row ki unchai.
 */
export function Table({ cols, rows, rowH = 57, empty = "Nothing here yet.", minW = 760 }) {
  const total = cols.reduce((s, c) => s + (c.w || 0), 0) || 1;
  return (
    <div className="sk-tw" data-scroll>
      <table className="sk-t" style={{ minWidth: minW, "--rh": `${rowH}px` }}>
        <colgroup>
          {cols.map((c, i) => (
            <col key={i} style={{ width: `${((c.w || 0) / total) * 100}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {cols.map((c, i) => (
              <th key={i}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={cols.length} className="sk-t__empty">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <style>{`
        .sk-tw { margin-top: 22px; overflow-x: auto; }
        .sk-t { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .sk-t th { height: 40px; padding: 0 11px; text-align: left; vertical-align: middle; font-size: 10px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #9aa2b4; border-bottom: 1px solid var(--ad-line); white-space: nowrap; }
        .sk-t td { height: var(--rh); padding: 0 11px; font-size: 13px; color: var(--ad-ink); border-bottom: 1px solid var(--ad-line); vertical-align: middle; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sk-t tr:last-child td { border-bottom: 0; }
        .sk-t tbody tr { transition: background .12s; }
        .sk-t tbody tr:hover td { background: #fafbfe; }
        .sk-t td b, .sk-t td strong { font-weight: 700; }
        .sk-t .sk-t__empty { height: 80px; text-align: center; color: #8a8aa0; font-size: 14px; }
        .sk-t .ad-badge { height: 24px; padding: 0 10px; }
        .sk-link { font-size: 13px; font-weight: 800; color: #6657e9; background: none; border: 0; padding: 0; }
        .sk-link:hover { color: var(--ad-primary-2); }
        .sk-link--blue { color: #6151ea; }
        .sk-muted { font-size: 12px; color: var(--ad-muted); }
        @media (max-width: 640px) { .sk-tw { margin-left: -16px; margin-right: -16px; padding: 0 5px; } }
      `}</style>
    </div>
  );
}

export function Notice({ icon = "⚠", children, className = "" }) {
  return (
    <p className={`sk-note ${className}`}>
      <span>{icon}</span>
      <span>{children}</span>
      <style>{`
        .sk-note { display: flex; align-items: flex-start; gap: 10px; padding: 13px 15px; border-radius: 13px; background: #fff7e9; border: 1px solid #f6dfb2; font-size: 12px; line-height: 1.45; color: #986016; }
      `}</style>
    </p>
  );
}

export function useToast() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(""), 2400);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div className="ad-toast" role="status">
      ✓ {msg}
    </div>
  ) : null;
  return [node, setMsg];
}

/** browser mein file download (prototype CSV/JSON) */
export function downloadFile(name, text, type = "text/csv") {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch {
    /* ignore */
  }
}

export const toCsv = (head, rows) =>
  [head, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
