"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Reports / Activity / Users / Settings ke common blocks (Figma) + Supabase data ke formatters:
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

/** say("Saved") → ✓ toast · say("Couldn't save", true) → error toast */
export function useToast() {
  const [t, setT] = useState(null);
  useEffect(() => {
    if (!t) return undefined;
    const x = setTimeout(() => setT(null), t.err ? 4200 : 2600);
    return () => clearTimeout(x);
  }, [t]);
  const node = t ? (
    <div className="ad-toast" role="status" style={t.err ? { background: "var(--ad-red)" } : undefined}>
      {t.err ? "⚠" : "✓"} {t.msg}
    </div>
  ) : null;
  const say = (msg, err = false) => setT(msg ? { msg: String(msg), err, at: Date.now() } : null);
  return [node, say];
}

/* ---------- Supabase data ke chhote helpers (purane app ke fmtDate / fmtDateTime / ago jaise) ---------- */
export const fmtNum = (n) => (Number(n) || 0).toLocaleString("en-IN");
export const kfmt = (n) => {
  n = Number(n) || 0;
  return n >= 1e7 ? (n / 1e6).toFixed(0) + "M" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e4 ? Math.round(n / 1e3) + "K" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K" : String(Math.round(n));
};
export const fmtMoney = (n) => {
  n = Number(n) || 0;
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(1).replace(/\.0$/, "") + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1).replace(/\.0$/, "") + "L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return "₹" + n;
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "13 Sep 2026" (Figma jaisa — browser ka "Sept" nahi) */
export const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return isNaN(x) ? String(d) : `${x.getDate()} ${MON[x.getMonth()]} ${x.getFullYear()}`;
};
/** "1 Nov, 11:30 am" */
export const fmtDateTime = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  if (isNaN(x)) return String(d);
  const h = x.getHours();
  return `${x.getDate()} ${MON[x.getMonth()]}, ${h % 12 || 12}:${String(x.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
/** "2 min ago" — sirf effect / event ke andar ya data aane ke baad (render par Date.now theek hai kyunki ye client page hai aur data baad mein aata hai) */
export const ago = (t) => {
  if (!t) return "—";
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
/** table ki empty line: loading / error (+Retry) / khali */
export function emptyState({ loading, error, reload, empty }) {
  if (loading) return "Loading…";
  if (error)
    return (
      <span>
        {String(error.message || error)}{" "}
        {reload && (
          <button type="button" className="sk-link" onClick={() => reload()}>
            Retry
          </button>
        )}
      </span>
    );
  return empty;
}
/** objects ki list → CSV (saari keys, nested JSON) — purane toCsv jaisa */
export function objectsToCsv(rows) {
  const keys = [];
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => !keys.includes(k) && keys.push(k)));
  const cell = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [keys.join(",")].concat(rows.map((r) => keys.map((k) => cell(r[k])).join(","))).join("\n");
}

/** browser mein file download (CSV / JSON) */
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
