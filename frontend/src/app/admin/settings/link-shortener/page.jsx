"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast, fmtDateTime, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

const DAYS = [1, 7, 30, 90, 365];
const daysLabel = (n) => (n === 1 ? "Last 24 hours" : n === 365 ? "Last year" : `Last ${n} days`);
const short = (u) => String(u || "").replace(/^https?:\/\//, "");
const pct = (n, t) => (t ? Math.round((100 * n) / t) : 0);

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("Copy this link:", text);
    return false;
  }
}

/**
 * /admin/settings/link-shortener — purane app ka "Link shortener":
 *  banao = api.admin_link_create · list = api.admin_links_list · clicks = api.admin_link_stats · stop/on = api.admin_link_toggle
 */
export default function SettingsLinks() {
  const list = useRpc("admin", "api.admin_links_list");
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null); // link row
  const [origin, setOrigin] = useState("");
  const [toast, say] = useToast();
  useEffect(() => setOrigin(window.location.origin), []);
  const base = list.data?.base || origin;
  const links = list.data?.links || [];

  const shorten = async (e) => {
    e.preventDefault();
    let u = url.trim();
    if (!u) return setErr("Paste a link first.");
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    setBusy(true);
    const { data, error } = await rpc("admin", "api.admin_link_create", { p_url: u, p_title: null, p_slug: null });
    setBusy(false);
    if (error) return setErr(errText(error));
    setErr("");
    setUrl("");
    if (data?.short) await copy(data.short);
    say(`Short link made — copied${data?.short ? `: ${short(data.short)}` : ""}`);
    list.reload();
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="🔗 Make a short link" sub="Paste any link — a shop page, a form, a Drive file, a reel. Every click is tracked: when, city, phone / browser.">
        <form className="sl-form" onSubmit={shorten}>
          <input className="ga-input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link to shorten" />
          <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
            {busy ? "Shortening…" : "Shorten"}
          </button>
        </form>
        {err && <p className="sl-err">{err}</p>}
      </Panel>
      <Panel title="Your links" className="sl-list">
        <Table
          rowH={48}
          minW={720}
          empty={emptyState({ loading: list.loading, error: list.error, reload: list.reload, empty: "No links yet — paste one above." })}
          cols={[
            { label: "Short link", w: 408 },
            { label: "Goes to", w: 236 },
            { label: "Clicks", w: 121 },
            { label: "Last click", w: 168 },
            { label: "", w: 143 },
          ]}
          rows={links.map((l) => [
            <b key="s" title={l.title || ""} className={l.active ? "" : "sl-off"}>
              {short(base)}/s/{l.slug}
              {l.active ? "" : " · stopped"}
            </b>,
            <span key="t" className="sk-muted" title={l.url}>
              {short(l.url)}
            </span>,
            l.clicks || 0,
            l.last_click_at ? fmtDateTime(l.last_click_at) : "—",
            <button key="c" type="button" className="sk-link sk-link--blue" onClick={() => setOpen(l)}>
              Clicks →
            </button>,
          ])}
        />
      </Panel>

      {open && <LinkStats link={open} base={base} onClose={() => setOpen(null)} say={say} onChange={list.reload} />}
      {toast}
      <style>{`
        .sl-form { display: flex; gap: 8px; margin-top: 18px; }
        .sl-form .ga-input { width: 270px; height: 43px; }
        .sl-form .ga-input::placeholder { color: #757575; }
        .sl-form .ga-btn { height: 40px; margin-top: 1px; }
        .sl-err { margin-top: 8px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .sl-list { padding-bottom: 20px; }
        .sl-off { color: var(--ad-muted); }
        @media (max-width: 640px) { .sl-form .ga-input { flex: 1; width: auto; min-width: 0; } }
      `}</style>
    </AdminShell>
  );
}

/* Ek link ke clicks — popup (purane "📊 Analytics" ka data) */
function LinkStats({ link, base, onClose, say, onChange }) {
  const [days, setDays] = useState(30);
  const st = useRpc("admin", "api.admin_link_stats", { p_slug: link.slug, p_days: days });
  const [active, setActive] = useState(!!link.active);
  const [ask, setAsk] = useState(false);
  const d = st.data || {};
  const t = d.totals || {};
  const sh = `${base}/s/${link.slug}`;
  const cityTotal = (d.by_city || []).reduce((a, x) => a + (Number(x.n) || 0), 0);
  const cities = (d.by_city || [])
    .slice(0, 3)
    .map((x) => `${x.k} ${pct(x.n, cityTotal)}%`)
    .join(" · ");
  const devices = d.by_os && d.by_os.length ? d.by_os : d.by_device || [];

  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  const toggle = async () => {
    const on = !active;
    if (!on && !ask) return setAsk(true);
    setAsk(false);
    const { error } = await rpc("admin", "api.admin_link_toggle", { p_slug: link.slug, p_active: on });
    if (error) return say(errText(error), true);
    setActive(on);
    say(on ? "Link turned back on" : "Link stopped — it shows “Link not found”");
    onChange();
  };

  return (
    <div className="ga-overlay" onClick={onClose}>
      <div className="ga-modal sl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Link clicks">
        <h2 className="ga-h2">
          {short(base)}/s/{link.slug}
        </h2>
        <p className="sl-modal__p">Goes to {short(d.url || link.url)}</p>
        <label className="sl-days">
          <span>{daysLabel(days)}</span>
          <select value={days} onChange={(e) => setDays(+e.target.value || 30)} aria-label="Period">
            {DAYS.map((n) => (
              <option key={n} value={n}>
                {daysLabel(n)}
              </option>
            ))}
          </select>
        </label>
        <div className="sl-nums">
          <div>
            <strong>{st.loading ? "…" : t.clicks || 0}</strong>
            <span>Clicks · {t.people || 0} people</span>
          </div>
          <div>
            <strong>{st.loading ? "…" : t.last ? fmtDateTime(t.last) : "—"}</strong>
            <span>Last click</span>
          </div>
        </div>
        {st.error ? (
          <p className="sl-modal__p">{errText(st.error)}</p>
        ) : (
          <>
            <p className="sl-modal__p">
              <b>Top cities:</b> {cities || "No clicks in this period yet"}
            </p>
            {devices.length > 0 && (
              <p className="sl-modal__p">
                <b>Devices:</b> {devices.slice(0, 3).map((x) => `${x.k} ${x.n}`).join(" · ")}
              </p>
            )}
            {(d.by_ref || []).length > 0 && (
              <p className="sl-modal__p">
                <b>Came from:</b> {d.by_ref.slice(0, 3).map((x) => `${x.k} ${x.n}`).join(" · ")}
              </p>
            )}
          </>
        )}
        {ask && <p className="sl-warn">Stop this link? Anyone who opens it will see “Link not found”. You can turn it back on any time.</p>}
        <div className="sl-modal__btns">
          <button type="button" className={`ga-btn ${ask ? "ga-btn--danger" : "ga-btn--ghost"}`} onClick={toggle}>
            {active ? (ask ? "Yes, stop link" : "⏸ Stop") : "▶ Turn on"}
          </button>
          <button
            type="button"
            className="ga-btn ga-btn--ghost"
            onClick={async () => {
              await copy(sh);
              say("Link copied");
            }}
          >
            Copy link
          </button>
          <button type="button" className="ga-btn ga-btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      <style>{`
        .sl-modal { width: min(460px, 100%); padding: 24px; }
        .sl-modal .ga-h2 { word-break: break-all; }
        .sl-modal__p { margin-top: 10px; font-size: 13px; color: var(--ad-muted); word-break: break-word; }
        .sl-modal__p b { color: var(--ad-ink); }
        .sl-days { position: relative; display: inline-flex; align-items: center; height: 34px; margin-top: 12px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--ad-line-2); font-size: 12.5px; color: #293652; }
        .sl-days select { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .sl-nums { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .sl-nums div { display: flex; flex-direction: column; padding: 16px; border-radius: 14px; background: var(--ad-soft-2); min-width: 0; }
        .sl-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sl-nums span { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
        .sl-warn { margin-top: 14px; padding: 10px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .sl-modal__btns { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .sl-modal__btns > * { flex: 1; } }
      `}</style>
    </div>
  );
}
