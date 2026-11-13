"use client";

/* Brand CRM + Messaging ke chhote helpers (dates, paise, toast) */
import { useCallback, useEffect, useState } from "react";

const dOpt = { day: "numeric", month: "short", year: "numeric" };
export const fmtDate = (t) => {
  if (!t) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", dOpt).format(new Date(t));
  } catch {
    return "—";
  }
};
export const fmtDateTime = (t) => {
  if (!t) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(t));
  } catch {
    return "—";
  }
};
/** "4:47 pm" aaj ke liye, warna "12 Nov" */
export const fmtWhen = (t) => {
  if (!t) return "—";
  const d = new Date(t);
  const today = new Date().toDateString() === d.toDateString();
  try {
    return today ? new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(d).toLowerCase() : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d);
  } catch {
    return "—";
  }
};
export const ago = (t) => {
  if (!t) return "";
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
};
export const num = (n) => (Number(n) || 0).toLocaleString("en-IN");
/** ₹1.1L / ₹64K / ₹500 */
export const inr = (v) => {
  const n = Number(v) || 0;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(".0", "")}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};
export const inrFull = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const ini = (name = "?") => {
  const s = String(name).replace(/^[@+]/, "").trim();
  return (s.includes(" ") ? s.split(/\s+/).slice(0, 2).map((w) => w[0]).join("") : s.slice(0, 2)).toUpperCase() || "?";
};

/** 2.4 sec ka toast: const [toast, say] = useToast(); say("Saved") */
export function useToast() {
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const say = useCallback((m) => setToast(String(m || "")), []);
  return [toast, say];
}

/** chhota loading / error / khaali line — Figma style */
export function StateLine({ loading, error, onRetry, children }) {
  if (loading) return <p className="sl">Loading…{style}</p>;
  if (error)
    return (
      <p className="sl sl--err">
        {error}{" "}
        {onRetry && (
          <button type="button" onClick={() => onRetry()}>
            Retry
          </button>
        )}
        {style}
      </p>
    );
  return children || null;
}
const style = (
  <style>{`
    .sl { padding: 18px 4px; font-size: 13px; color: var(--ad-muted); }
    .sl--err { color: var(--ad-red); }
    .sl button { margin-left: 6px; border: 0; background: none; padding: 0; font-size: 13px; font-weight: 800; color: #6657e9; }
  `}</style>
);
