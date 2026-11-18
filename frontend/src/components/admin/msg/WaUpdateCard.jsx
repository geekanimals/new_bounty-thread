"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";

/*
 * WhatsApp campaign updates — purane adminWaSettingsCard jaisa.
 * 24 ghante ke bahar typed / step update ek approved Utility template mein jaata hai (admin_wa_settings / admin_set_wa_settings).
 * Saath mein: pichhle 3 din ke sent / failed / waiting, aakhri problem, aur links kis domain par khulte hain (admin_links_status).
 */
const NAME = "geek_campaign_update";
const BODY = "Hello {{1}},\n\nThere is a new update on your campaign with Geek:\n{{2}}\n\nPlease view the details and your next step here: {{3}}\n\nRegards,\nTeam Geek";
const FOOT = "Reply STOP to stop WhatsApp updates";

export default function WaUpdateCard() {
  const s = useRpc("admin", "admin_wa_settings");
  const ls = useRpc("admin", "admin_links_status");
  const d = s.data || {};
  const [name, setName] = useState(null);
  const [lang, setLang] = useState(null);
  const [msg, setMsg] = useState("");
  const tpl = name ?? (d.template || "");
  const lg = lang ?? (d.lang || "en");
  const dom = ls.data && (ls.data.links_domain || ls.data.app_url);
  const src = ls.data && (ls.data.links_source === "secret" ? "APP_URL secret on Supabase" : ls.data.links_source === "vercel" ? "APP_URL on Vercel" : "");
  const copy = async (v) => {
    try {
      await navigator.clipboard.writeText(v);
      setMsg("Copied ✓");
    } catch {
      window.prompt("Copy:", v);
    }
  };
  const save = async (n) => {
    const { data: r, error } = await rpc("admin", "admin_set_wa_settings", { p_template: n, p_lang: lg });
    if (error) return setMsg(errText(error));
    setMsg(n ? `Saved ✓ — ${(r && r.requeued) || 0} held update(s) sending now` : "Turned off");
    s.reload(true);
  };

  return (
    <section className="ga-card wu">
      {ls.data && (
        <p className={dom ? "wu-mute" : "wu-warn"}>
          {dom ? (
            <>
              🔗 Links in WhatsApp &amp; email open <b>{dom}</b>
              {src ? ` (from ${src})` : ""}
            </>
          ) : (
            <>⚠️ Links in WhatsApp &amp; email have no domain yet — set APP_URL (e.g. https://app.yourdomain.com) and redeploy.</>
          )}
        </p>
      )}
      <h3 className="ga-h2">
        ✅ WhatsApp campaign updates <span className="ga-badge ga-badge--green">on · {d.template || NAME}</span>
      </h3>
      {s.error ? (
        <p className="wu-warn">{errText(s.error)}</p>
      ) : (
        <>
          <p className="wu-mute">
            WhatsApp only allows free text within 24 hours of the creator&apos;s last message. Every other update needs <b>one approved Utility template</b> — the same one carries every campaign and every step.
            {d.held ? <b className="wu-amber"> {d.held} update(s) are waiting and go out the moment you save an approved template.</b> : null}
          </p>
          <div className="wu-health">
            Last 3 days on WhatsApp: <b className="wu-green">{d.sent || 0} sent</b> · <b className={d.failed ? "wu-red" : ""}>{d.failed || 0} failed</b> · <b>{d.held || 0} waiting</b>
            {d.last_error && (
              <p className="wu-amber">
                <b>Latest problem:</b> {d.last_error}
              </p>
            )}
          </div>
          <details className="wu-how" open={!d.template}>
            <summary>📋 How this template is set up in snapto (copy body / footer)</summary>
            <p>
              <b>1.</b> In snapto → Templates → New: category <b>Utility</b>, language <b>English</b>, name <code>{NAME}</code>{" "}
              <button type="button" className="wu-mini" onClick={() => copy(NAME)}>
                ⧉
              </button>
            </p>
            <p>
              <b>2.</b> Body{" "}
              <button type="button" className="wu-mini" onClick={() => copy(BODY)}>
                Copy body
              </button>{" "}
              · Footer{" "}
              <button type="button" className="wu-mini" onClick={() => copy(FOOT)}>
                Copy footer
              </button>
            </p>
            <pre className="wu-pre">
              {BODY}
              {"\n— " + FOOT}
            </pre>
            <p>
              <b>3.</b> Once snapto shows it <b>Approved</b>, put the name here and save.
            </p>
          </details>
          <div className="wu-row">
            <input className="ga-input wu-in" value={tpl} onChange={(e) => setName(e.target.value)} placeholder={NAME} aria-label="Approved template name" />
            <select className="ga-input wu-sel" value={lg} onChange={(e) => setLang(e.target.value)} aria-label="Template language">
              {[
                ["en", "English (en)"],
                ["en_US", "English US (en_US)"],
                ["en_GB", "English UK (en_GB)"],
                ["hi", "Hindi (hi)"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <button type="button" className="ga-btn ga-btn--primary wu-b" onClick={() => (tpl.trim() ? save(tpl.trim()) : setMsg("Type the approved template name first."))}>
              Save &amp; send held updates
            </button>
            <button type="button" className="ga-btn ga-btn--ghost wu-b" onClick={() => window.confirm("Stop sending WhatsApp updates outside the 24-hour window?") && save(null)}>
              Turn off
            </button>
            {msg && <span className="wu-mute">{msg}</span>}
          </div>
          <p className="wu-mute">
            Then use <b>Send test</b> with your own WhatsApp number to check it arrives.
            {d.no_number ? ` · ${d.no_number} recent people have no WhatsApp number (they get app + email only).` : ""}
            {d.opted_out ? ` · ${d.opted_out} people replied STOP.` : ""}
          </p>
        </>
      )}
      <style>{`
        .wu { padding: 20px 22px; margin-bottom: 18px; }
        .wu-mute { font-size: 12.5px; color: var(--ad-muted); margin-top: 6px; line-height: 1.5; }
        .wu-warn { font-size: 12.5px; color: #b45309; margin-bottom: 6px; }
        .wu-amber { color: #b45309; }
        .wu-green { color: #12b76a; }
        .wu-red { color: #dc2626; }
        .wu-health { margin-top: 10px; padding: 8px 10px; border: 1px solid var(--ad-line); border-radius: 10px; font-size: 13px; }
        .wu-how { margin-top: 10px; font-size: 13px; }
        .wu-how summary { cursor: pointer; font-weight: 800; color: var(--ad-primary); }
        .wu-how p { margin-top: 6px; }
        .wu-pre { margin-top: 6px; padding: 10px; border-radius: 10px; background: var(--ad-soft-2); font-size: 12.5px; white-space: pre-wrap; }
        .wu-mini { padding: 2px 8px; border-radius: 7px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
        .wu-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 10px; }
        .wu-in { width: 260px; height: 38px; }
        .wu-sel { width: auto; height: 38px; padding: 0 10px; }
        .wu-b { height: 38px; padding: 0 14px; font-size: 13px; }
      `}</style>
    </section>
  );
}
