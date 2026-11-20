"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { rpc, useRpc, errText } from "@/lib/supabase";

/*
 * WhatsApp jo creator tak nahi pahuncha — api.admin_delivery_alerts (6 baar roz check: 9, 11, 1, 3, 5, 7).
 *  AlertBell            → admin top bar ka 🔔 (sab campaigns)
 *  CampaignAlertBanner  → campaign ke andar laal patti + pop-up (sirf us campaign ke)
 */
const when = (t) => (t ? new Date(t).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const camHref = (a) => `/vault/campaigns/${a.public_id || a.campaign_id}/delivery`;

// ek creator (number + campaign) = ek card; kitni baar fail hua + aakhri baar kab
export const groupAlerts = (items) => {
  const m = new Map();
  (items || []).forEach((a) => {
    const k = `${a.phone || a.who}|${a.campaign_id || ""}`;
    const g = m.get(k);
    if (g) {
      g.n++;
      if (new Date(a.happened_at) > new Date(g.happened_at)) Object.assign(g, { happened_at: a.happened_at });
    } else m.set(k, { ...a, n: 1 });
  });
  return [...m.values()].sort((x, y) => new Date(y.happened_at) - new Date(x.happened_at));
};
const short = (r) => (/131026/.test(r || "") ? "This number is not on WhatsApp (or can't receive). Get another number from the creator." : r);

function AlertList({ items }) {
  const list = groupAlerts(items);
  if (!list.length) return <p className="dla-empty">All campaign messages were delivered ✓</p>;
  return (
    <ul className="dla-list">
      {list.map((a) => (
        <li key={a.id}>
          <div className="dla-top">
            <b>{a.who || a.phone || "Creator"}</b>
            <span>{a.n > 1 ? `${a.n} messages · last ${when(a.happened_at)}` : when(a.happened_at)}</span>
          </div>
          <div className="dla-mid">
            {a.campaign ? <span className="dla-camp">{a.campaign}</span> : null}
            {a.phone ? <span className="dla-ph">{a.phone}</span> : null}
          </div>
          <p className="dla-why">{short(a.reason)}</p>
        </li>
      ))}
    </ul>
  );
}

const CSS = `
  .dla-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .dla-list li { padding: 10px 12px; border-radius: 10px; border: 1px solid #f3d3d3; background: #fff7f7; }
  .dla-top { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
  .dla-top span { font-size: 11.5px; color: var(--ad-muted, #7a8099); white-space: nowrap; }
  .dla-mid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .dla-camp { padding: 1px 7px; border-radius: 999px; background: #eeebff; color: #4b3fc4; font-size: 11px; font-weight: 700; }
  .dla-ph { font-size: 11.5px; color: var(--ad-muted, #7a8099); }
  .dla-why { margin: 5px 0 0; font-size: 12.5px; color: #a3262b; line-height: 1.4; }
  .dla-empty { margin: 6px 0; font-size: 13px; color: #22a06b; font-weight: 700; }
  .dla-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
`;

export function AlertBell() {
  const al = useRpc("admin", "api.admin_delivery_alerts", { p_campaign: null, p_limit: 30 }, { refreshMs: 60000 });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const ref = useRef(null);
  const d = al.data || {};
  const n = Number(d.open) || 0;
  useEffect(() => {
    if (!open) return;
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  const seenAll = async () => {
    setBusy("seen");
    await rpc("admin", "api.admin_delivery_alerts_seen", { p_campaign: null });
    await al.reload(true);
    setBusy("");
  };
  const checkNow = async () => {
    setBusy("check");
    const { error } = await rpc("admin", "api.admin_delivery_check_now", {});
    if (error) alert(errText(error));
    await al.reload(true);
    setBusy("");
  };
  return (
    <div className="dla-bellwrap" ref={ref}>
      <button type="button" className={`as-icon dla-bell ${n ? "has-new" : ""}`} onClick={() => setOpen((o) => !o)} aria-label={n ? `${n} messages not delivered` : "Message delivery"} title={n ? `${n} WhatsApp messages not delivered` : "Message delivery — all good"}>
        🔔{n > 0 && <span className="dla-count">{n > 99 ? "99+" : n}</span>}
      </button>
      {open && (
        <div className="dla-pop" role="dialog" aria-label="Messages not delivered">
          <div className="dla-pophead">
            <b>Not delivered {n ? `· ${n}` : ""}</b>
            <span>Checked 6× a day{d.last_check ? ` · last ${when(d.last_check)}` : ""}</span>
          </div>
          <div className="dla-popbody">
            <AlertList items={d.items || []} />
          </div>
          <div className="dla-btns">
            {n > 0 && (
              <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={seenAll}>
                {busy === "seen" ? "…" : "Mark all as seen"}
              </button>
            )}
            <button type="button" className="ga-btn ga-btn--ghost" disabled={!!busy} onClick={checkNow}>
              {busy === "check" ? "Checking…" : "Check now"}
            </button>
          </div>
        </div>
      )}
      <style>{`
        ${CSS}
        .dla-bellwrap { position: relative; }
        .dla-bell { position: relative; }
        .dla-bell.has-new { background: #fdecec; }
        .dla-count { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; padding: 0 5px; display: grid; place-items: center; border-radius: 999px; background: #e5484d; color: #fff; font-size: 10.5px; font-weight: 800; box-shadow: 0 0 0 2px #fff; }
        .dla-pop { position: absolute; right: 0; top: 44px; z-index: 80; width: min(380px, 92vw); padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line, #e6e8f0); background: #fff; box-shadow: 0 20px 40px -18px rgba(20,22,60,.35); }
        .dla-pophead { display: flex; flex-direction: column; gap: 2px; margin-bottom: 10px; }
        .dla-pophead b { font-size: 14px; }
        .dla-pophead span { font-size: 11.5px; color: var(--ad-muted, #7a8099); }
        .dla-popbody { max-height: 360px; overflow-y: auto; }
        .dla-pop .dla-list li a { color: inherit; }
      `}</style>
    </div>
  );
}

export function CampaignAlertBanner({ id }) {
  const on = !!id && id !== "sample";
  const al = useRpc("admin", "api.admin_delivery_alerts", { p_campaign: id, p_limit: 50 }, { skip: !on, refreshMs: 120000 });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const d = al.data || {};
  const n = Number(d.open) || 0;
  const items = d.items || [];
  const people = groupAlerts(items).length;
  // pop-up khud nahi khulta — banner par tap karo tab dikhta hai
  if (!on || !n) return null;
  const seen = async () => {
    setBusy(true);
    await rpc("admin", "api.admin_delivery_alerts_seen", { p_campaign: id });
    await al.reload(true);
    setBusy(false);
    setShow(false);
  };
  return (
    <>
      <button type="button" className="dla-banner" onClick={() => setShow(true)}>
        ⚠️ <b>{people || n} creator{(people || n) > 1 ? "s" : ""} didn&apos;t get WhatsApp</b> in this campaign ({n} message{n > 1 ? "s" : ""}) — see who and why →
      </button>
      {show && (
        <div className="ga-overlay" onClick={() => setShow(false)}>
          <div className="ga-modal dla-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Messages not delivered">
            <div className="dla-mhead">
              <h2>⚠️ WhatsApp not delivered · {people || n} creator{(people || n) > 1 ? "s" : ""}</h2>
              <button type="button" className="dla-x" onClick={() => setShow(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <p className="dla-sub">These creators didn&apos;t get a WhatsApp message. Fix the number or reach them another way. Checked 6× a day.</p>
            <div className="dla-mbody">
              <AlertList items={items} />
            </div>
            <div className="dla-btns">
              <button type="button" className="ga-btn ga-btn--primary" disabled={busy} onClick={seen}>
                {busy ? "…" : "Mark as seen"}
              </button>
              <Link href={items[0] ? camHref(items[0]) : `/vault/campaigns/${id}/delivery`} className="ga-btn ga-btn--ghost" onClick={() => setShow(false)}>
                Open delivery log
              </Link>
            </div>
          </div>
        </div>
      )}
      <style>{`
        ${CSS}
        .dla-banner { display: block; width: 100%; margin: -10px 0 18px; padding: 11px 14px; border-radius: 12px; border: 1px solid #f3c4c4; background: #fff1f1; color: #a3262b; font-size: 13.5px; text-align: left; cursor: pointer; }
        .dla-banner:hover { background: #ffe8e8; }
        .dla-modal { width: min(560px, 94vw); padding: 22px 24px 20px; }
        .dla-modal .dla-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .dla-mhead { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .dla-mhead h2 { margin: 0; font-size: 18px; line-height: 1.3; }
        .dla-x { width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--ad-line-2, #e2e4ee); background: #fff; font-weight: 800; cursor: pointer; }
        .dla-sub { margin: 6px 0 12px; font-size: 13px; color: var(--ad-muted, #7a8099); }
        .dla-mbody { max-height: 55vh; overflow-y: auto; }
      `}</style>
    </>
  );
}
