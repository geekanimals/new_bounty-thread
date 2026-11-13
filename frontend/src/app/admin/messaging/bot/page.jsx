"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import MsgHead from "@/components/admin/msg/MsgHead";
import PTable from "@/components/admin/brand/PTable";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { ago, fmtDateTime, useToast } from "@/components/admin/brand/util";

const MENU = [
  ["1 · Help me", "Answers from FAQs and their data"],
  ["2 · Complete my profile", "Sends the missing fields + link"],
  ["3 · My campaign", "Step, deadline, courier status"],
  ["4 · Talk to a team member", "Alerts the team · bot goes quiet"],
  ["5 · Something else", "Hands to the team"],
];
const REASON = { team_reply: "the team replied", handoff: "waiting for the team", manual: "paused by you" };

/**
 * /admin/messaging/bot — WhatsApp help bot (Figma 081), purane app jaisa:
 *  public.admin_bot_overview(40) · settings: admin_bot_settings (+ admin_bot_mode "direct" jab pehli baar on)
 *  pause / unpause a number: admin_bot_pause · "What the bot sees": admin_bot_preview
 */
export default function WhatsAppBot() {
  const { data, error, loading, reload } = useRpc("admin", "admin_bot_overview", { p_limit: 40 });
  const d = data || {};
  const S = d.settings || {};
  const P = d.paused || [];
  const L = d.log || [];
  const bot = !!S.enabled;
  const quiet = Number(S.team_pause_hours) > 0;
  const delay = Number(S.reply_delay_min) > 0;
  const [askOn, setAskOn] = useState(false);
  const [sees, setSees] = useState(false);
  const [seeNum, setSeeNum] = useState("");
  const [seen, setSeen] = useState(null);
  const [pause, setPause] = useState(false);
  const [num, setNum] = useState("");
  const [toast, say] = useToast();

  const save = async (patch, msg) => {
    const r = await rpc("admin", "admin_bot_settings", { p_enabled: null, p_delay: null, p_pause_hours: null, p_use_ai: null, ...patch });
    if (r.error) return say(errText(r.error));
    say(msg || "Saved ✓");
    reload(true);
  };
  const toggleBot = async () => {
    if (!bot && !askOn) return setAskOn(true);
    setAskOn(false);
    if (!bot && S.mode === "snapto") await rpc("admin", "admin_bot_mode", { p_mode: "direct" });
    save({ p_enabled: !bot }, bot ? "Help bot turned off" : "Help bot is answering creators ✓");
  };

  const clean = (n) => n.replace(/[^\d+]/g, "");
  const doPause = async (e) => {
    e.preventDefault();
    const n = clean(num);
    if (n.replace(/\D/g, "").length < 10) return say("Enter a 10-digit WhatsApp number");
    const r = await rpc("admin", "admin_bot_pause", { p_phone: n, p_hours: 24 });
    if (r.error) return say(errText(r.error));
    setNum("");
    setPause(false);
    say(`Bot paused for ${n} for 24 h ✓`);
    reload(true);
  };
  const unpause = async (phone) => {
    const r = await rpc("admin", "admin_bot_pause", { p_phone: phone, p_hours: 0 });
    if (r.error) return say(errText(r.error));
    reload(true);
  };
  const check = async (e) => {
    e.preventDefault();
    const n = clean(seeNum);
    if (n.replace(/\D/g, "").length < 10) return say("Enter the creator’s WhatsApp number");
    setSeen({ loading: true });
    const r = await rpc("admin", "admin_bot_preview", { p_phone: n });
    if (r.error) return setSeen({ error: errText(r.error) });
    setSeen(r.data || {});
  };
  const seenText = (c) => {
    const camps = c.campaigns || [];
    const inv = c.invites || [];
    const ex = c.extra || {};
    return [
      `creator: ${c.name || c.phone || "—"} · ${c.registered ? "registered" : "not registered on this number"}`,
      (c.needs || []).length ? `still to connect: ${c.needs.join(", ")}` : null,
      ...camps.slice(0, 8).map((x) => `campaign: ${x.campaign}${x.brand ? ` (${x.brand})` : ""} · ${String(x.stage || "").replace(/_/g, " ")}${ex[x.participation_id]?.pending ? ` · to do: ${ex[x.participation_id].pending}` : ""}`),
      ...inv.map((i) => `bulk sheet: ${i.campaign} · ${String(i.status || "").replace(/_/g, " ")}`),
      !camps.length && !inv.length ? "no campaign on this number — the bot sends the register steps" : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  return (
    <AdminShell>
      <MsgHead />
      {error && (
        <p className="mb-err">
          Couldn’t load the bot: {errText(error)}{" "}
          <button type="button" onClick={() => reload()}>
            Retry
          </button>
        </p>
      )}
      <div className="mb-grid">
        <section className="ad-card mb-card">
          <div className="mb-top">
            <div>
              <h2 className="ad-h2">🤖 WhatsApp help bot</h2>
              <p className="mb-sub">Answers creators on WhatsApp from their live data — campaign, step, deadline, courier, profile.</p>
            </div>
            <span className={`ad-badge ${bot ? "ad-badge--green" : ""}`}>{loading ? "…" : bot ? "ON" : "OFF"}</span>
            <button type="button" className={`ad-btn ${bot ? "ad-btn--ghost" : "ad-btn--primary"} mb-turn`} onClick={toggleBot} disabled={loading || !!error}>
              {bot ? "Turn bot off" : "Turn bot on"}
            </button>
          </div>
          {askOn && (
            <div className="mb-ask">
              Turn the WhatsApp bot on? It will auto-reply to creators who message your snapto number, when the team hasn’t replied.
              <div className="mb-ask__b">
                <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={toggleBot}>
                  Yes, turn on
                </button>
                <button type="button" className="mb-link" onClick={() => setAskOn(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <h3 className="mb-h3">Welcome menu</h3>
          <p className="mb-sub">A new chat (or one quiet for 24 h) first gets the welcome + 5 options. The bot answers only after one is picked · 0 brings the menu back.</p>
          <div className="mb-menu">
            <PTable minW={520} rowH={48} cols={[{ label: "Option", w: "57.4%" }, { label: "What happens", w: "42.6%" }]} rows={MENU} />
          </div>

          <h3 className="mb-h3 mb-rules-h">Rules</h3>
          <div className="mb-rules">
            <button type="button" className="mb-rule" onClick={() => save({ p_pause_hours: quiet ? 0 : 12 }, quiet ? "Bot keeps replying after the team" : "Bot stays quiet after a team reply ✓")} aria-pressed={quiet} disabled={loading}>
              <i className={`ad-toggle ${quiet ? "is-on" : ""}`} />
              <span>
                <strong>Stay quiet when the team replies</strong>
                <small>{quiet ? `for ${S.team_pause_hours} h · from snapto or the app` : "from snapto or the app"}</small>
              </span>
            </button>
            <button type="button" className="mb-rule" onClick={() => save({ p_delay: delay ? 0 : 1 }, delay ? "Bot replies right away" : "Bot waits a minute before replying ✓")} aria-pressed={delay} disabled={loading}>
              <i className={`ad-toggle ${delay ? "is-on" : ""}`} />
              <span>
                <strong>Reply after</strong>
                <small>{delay ? `${S.reply_delay_min} min` : "right away"}</small>
              </span>
            </button>
          </div>
        </section>

        <section className="ad-card mb-card mb-side">
          <div className="mb-side__head">
            <h2 className="ad-h2">Recent replies</h2>
            <button type="button" className="mb-link" onClick={() => setSees(!sees)}>
              {sees ? "Hide data" : "What the bot sees"}
            </button>
          </div>
          {sees && (
            <div className="mb-seebox">
              <form className="mb-pause" onSubmit={check}>
                <input className="ad-input" inputMode="tel" placeholder="+91… creator’s WhatsApp" value={seeNum} onChange={(e) => setSeeNum(e.target.value)} aria-label="Creator WhatsApp number" />
                <button type="submit" className="ad-btn ad-btn--primary">
                  Check
                </button>
              </form>
              {seen && <pre className="mb-sees">{seen.loading ? "Checking…" : seen.error ? seen.error : seenText(seen)}</pre>}
            </div>
          )}
          <PTable
            minW={400}
            rowH={48}
            cols={[{ label: "When", w: "26.5%" }, { label: "Creator", w: "44.5%" }, { label: "Asked", w: "29%" }]}
            rows={L.map((j) => [
              <span key="w" title={fmtDateTime(j.at)}>
                {ago(j.at) || "—"}
              </span>,
              <b key="c" title={[j.phone, j.campaign].filter(Boolean).join(" · ")}>
                {j.name || j.phone || "—"}
              </b>,
              <span key="a" title={[j.question, j.reply ? `Bot: ${j.reply}` : j.reason].filter(Boolean).join("\n\n")}>
                {j.question || "—"}
              </span>,
            ])}
            empty={loading ? "Loading…" : "No messages yet."}
          />
          {P.length > 0 && (
            <div className="mb-paused">
              {P.map((p) => (
                <p key={p.phone}>
                  ⏸ {p.name || p.phone} · {REASON[p.reason] || p.reason} · till {fmtDateTime(p.until)}{" "}
                  <button type="button" className="mb-link" onClick={() => unpause(p.phone)}>
                    Let the bot reply
                  </button>
                </p>
              ))}
            </div>
          )}
          {pause ? (
            <form className="mb-pause" onSubmit={doPause}>
              <input className="ad-input" inputMode="tel" placeholder="+91 98765 43210" value={num} onChange={(e) => setNum(e.target.value)} aria-label="WhatsApp number" autoFocus />
              <button type="submit" className="ad-btn ad-btn--primary">
                Pause
              </button>
            </form>
          ) : (
            <button type="button" className="mb-link mb-pause-btn" onClick={() => setPause(true)}>
              ⏸️ Pause bot for a number (24 h)
            </button>
          )}
        </section>
      </div>
      {toast && <div className="ad-toast">{toast}</div>}
      <style>{`
        .mb-err { margin: 0 0 14px; font-size: 13px; color: var(--ad-red); }
        .mb-err button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .mb-ask { margin-top: 12px; padding: 12px 14px; border-radius: 13px; background: var(--ad-soft-2); border: 1px solid var(--ad-line); font-size: 13px; }
        .mb-ask__b { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
        .mb-seebox { margin: -14px 0 18px; }
        .mb-seebox .mb-pause { margin-top: 0; }
        .mb-seebox .mb-sees { margin: 10px 0 0; }
        .mb-paused p { margin-top: 6px; }
        .mb-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .mb-card { padding: 24px 22px 22px; min-width: 0; }
        .mb-top { display: flex; align-items: flex-start; gap: 10px; }
        .mb-top > div { flex: 1; min-width: 0; }
        .mb-top .ad-badge { margin-top: 17px; height: 26px; }
        .mb-turn { flex-shrink: 0; width: 88px; height: 59px; padding: 0 18px; white-space: normal; line-height: 1.3; }
        .mb-sub { margin-top: 9px; font-size: 12px; line-height: 1.33; color: var(--ad-muted); }
        .mb-h3 { margin-top: 18px; font-family: var(--ad-sans); font-size: 16.4px; font-weight: 700; color: var(--ad-ink); }
        .mb-menu { margin: 8px 0 0; }
        .mb-rules-h { margin-top: 12px; }
        .mb-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .mb-rule { display: flex; align-items: center; gap: 12px; min-height: 112px; padding: 14px 16px; border: 0; border-radius: 14px; background: var(--ad-soft-2); text-align: left; }
        .mb-rule i { flex-shrink: 0; width: 26px; height: 22px; background: #d3d7e4; }
        .mb-rule i:not(.is-on)::after { opacity: 0; }
        .mb-rule i::after { width: 16px; height: 16px; }
        .mb-rule i.is-on { width: 40px; background: var(--ad-primary); }
        .mb-rule strong { display: block; font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.37; color: var(--ad-ink); }
        .mb-rule small { display: block; margin-top: 3px; font-size: 12px; color: var(--ad-muted); }
        .mb-side__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 30px; }
        .mb-side__head .ad-h2 { margin-top: 8px; }
        .mb-link { border: 0; background: none; padding: 0; font-size: 14px; font-weight: 800; color: #6657e9; }
        .mb-link:hover { color: var(--ad-primary-2); }
        .mb-pause-btn { margin-top: 30px; }
        .mb-pause { display: flex; gap: 8px; margin-top: 18px; }
        .mb-pause .ad-btn { flex-shrink: 0; }
        .mb-paused { margin-top: 14px; font-size: 12px; color: var(--ad-orange); }
        .mb-sees { margin: -14px 0 18px; padding: 12px 14px; border-radius: 12px; background: var(--ad-soft-2); font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.6; color: var(--ad-text); white-space: pre-wrap; }
        .mb-side .pt-wrap { overflow-x: hidden; }
        .mb-side .pt { min-width: 0 !important; }
        @media (max-width: 1180px) { .mb-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .mb-card { padding: 18px 16px; }
          .mb-top { flex-wrap: wrap; }
          .mb-top .ad-badge { margin-top: 0; }
          .mb-turn { width: auto; height: 40px; margin-left: auto; }
          .mb-rules { grid-template-columns: 1fr; }
          .mb-rule { min-height: 0; }
          .mb-rule strong { font-size: 19px; }
          .mb-side__head { margin-bottom: 14px; }
        }
      `}</style>
    </AdminShell>
  );
}
