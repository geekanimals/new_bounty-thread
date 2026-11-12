"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { SettingsTabs, Panel, Table, useToast } from "@/components/admin/settings/kit";

const START = [
  { slug: "olio-pujo", to: "olio.in/pujo-offer", clicks: 412, last: "Today", cities: "Kolkata 61% · Mumbai 14% · Delhi 9%" },
  { slug: "beardo-kit", to: "beardo.in/detan", clicks: 188, last: "Yesterday", cities: "Delhi 33% · Pune 21% · Mumbai 18%" },
  { slug: "brief-circle", to: "drive.google.com/…", clicks: 64, last: "3 days", cities: "Mumbai 40% · Bengaluru 25%" },
];

/** /admin/settings/link-shortener — short link banao, clicks dekho */
export default function SettingsLinks() {
  const [links, setLinks] = useState(START);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(null);
  const [toast, say] = useToast();

  const shorten = (e) => {
    e.preventDefault();
    let u = url.trim();
    if (!u) return setErr("Paste a link first.");
    if (!/^https?:\/\//.test(u)) u = `https://${u}`;
    let host;
    try {
      host = new URL(u);
    } catch {
      return setErr("That doesn’t look like a link.");
    }
    const slug = (host.hostname.replace(/^www\./, "").split(".")[0] + "-" + Math.random().toString(36).slice(2, 6)).toLowerCase();
    setLinks((l) => [{ slug, to: (host.hostname + host.pathname).replace(/\/$/, "").slice(0, 34), clicks: 0, last: "—", cities: "No clicks yet" }, ...l]);
    try {
      navigator.clipboard?.writeText(`https://bountythreads.geekcreativeagency.com/s/${slug}`);
    } catch {
      /* ignore */
    }
    say("Short link made — copied");
    setUrl("");
    setErr("");
  };

  return (
    <AdminShell>
      <PageHead title="Settings" sub="Platform settings, team, links and system tools." />
      <SettingsTabs />
      <Panel title="🔗 Make a short link" sub="Paste any link — a shop page, a form, a Drive file, a reel. Every click is tracked: when, city, phone / browser.">
        <form className="sl-form" onSubmit={shorten}>
          <input className="ad-input" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link to shorten" />
          <button type="submit" className="ad-btn ad-btn--primary">
            Shorten
          </button>
        </form>
        {err && <p className="sl-err">{err}</p>}
      </Panel>
      <Panel title="Your links" className="sl-list">
        <Table
          rowH={48}
          minW={720}
          cols={[
            { label: "Short link", w: 408 },
            { label: "Goes to", w: 236 },
            { label: "Clicks", w: 121 },
            { label: "Last click", w: 168 },
            { label: "", w: 143 },
          ]}
          rows={links.map((l) => [
            <b key="s">bountythreads…/s/{l.slug}</b>,
            <span key="t" className="sk-muted">
              {l.to}
            </span>,
            l.clicks,
            l.last,
            <button key="c" type="button" className="sk-link sk-link--blue" onClick={() => setOpen(l)}>
              Clicks →
            </button>,
          ])}
        />
      </Panel>

      {open && (
        <div className="ad-overlay" onClick={() => setOpen(null)}>
          <div className="ad-modal sl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Link clicks">
            <h2 className="ad-h2">bountythreads…/s/{open.slug}</h2>
            <p className="sl-modal__p">Goes to {open.to}</p>
            <div className="sl-nums">
              <div>
                <strong>{open.clicks}</strong>
                <span>Clicks</span>
              </div>
              <div>
                <strong>{open.last}</strong>
                <span>Last click</span>
              </div>
            </div>
            <p className="sl-modal__p">
              <b>Top cities:</b> {open.cities}
            </p>
            <div className="sl-modal__btns">
              <button
                type="button"
                className="ad-btn ad-btn--ghost"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(`https://bountythreads.geekcreativeagency.com/s/${open.slug}`);
                  } catch {
                    /* ignore */
                  }
                  say("Link copied");
                }}
              >
                Copy link
              </button>
              <button type="button" className="ad-btn ad-btn--primary" onClick={() => setOpen(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}
      <style>{`
        .sl-form { display: flex; gap: 8px; margin-top: 18px; }
        .sl-form .ad-input { width: 270px; height: 43px; }
        .sl-form .ad-input::placeholder { color: #757575; }
        .sl-form .ad-btn { height: 40px; margin-top: 1px; }
        .sl-err { margin-top: 8px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .sl-list { padding-bottom: 20px; }
        .sl-modal { width: min(460px, 100%); padding: 24px; }
        .sl-modal__p { margin-top: 10px; font-size: 13px; color: var(--ad-muted); }
        .sl-modal__p b { color: var(--ad-ink); }
        .sl-nums { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .sl-nums div { display: flex; flex-direction: column; padding: 16px; border-radius: 14px; background: var(--ad-soft-2); }
        .sl-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; }
        .sl-nums span { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
        .sl-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 640px) { .sl-form .ad-input { flex: 1; width: auto; min-width: 0; } }
      `}</style>
    </AdminShell>
  );
}
