"use client";

import { useEffect, useState } from "react";
import { rpc, errText } from "@/lib/supabase";
import { sendWhatsApp } from "@/components/admin/campaign/journey";

/*
 * 🟢 WhatsApp to selected — purane ccWaPanel jaisa (sirf naye Utility messages):
 *  🎯 Each creator's own step — bhejne se pehle: kaunsa message kitno ko, kaun chhootega aur kyun (api.snapto_preview_current_step)
 *  ✍️ My own message — sirf jinki 24 ghante wali window khuli hai; wahi apne aap tick (api.campaign_wa_open_windows)
 * Kuch tab tak nahi jaata jab tak Send na dabao.
 */
const DRIP = {
  "01": "Campaign invite (not registered yet)",
  10: "Contract ready — sign it",
  12: "Confirm your delivery address",
  "07": "Product shipped — track it",
  "08": "Product delivered + video brief",
  "09": "Video due / overdue reminder",
  13: "Video approved — post it",
  14: "Campaign completed — thank you",
};
// template ka {{n}} → preview ke liye sample value
const fillTpl = (body, roles, campaign) =>
  String(body || "").replace(/\{\{(\d+)\}\}/g, (m, n) => {
    const r = (roles || [])[Number(n) - 1];
    return r === "name" ? "Asha" : r === "campaign" ? campaign || "Campaign" : m;
  });
const fdt = (v) => {
  const d = new Date(v);
  return isNaN(d) ? "" : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export default function WaPanel({ campaignId, keys, visible, setSel, onClose, onDone, say }) {
  const [mode, setMode] = useState("step");
  const [prev, setPrev] = useState(null);
  const [win, setWin] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [tpls, setTpls] = useState(null);
  const [tplName, setTplName] = useState("");
  const inv = keys.filter((k) => k[0] === "i").map((k) => k.slice(2));
  const parts = keys.filter((k) => k[0] === "p").map((k) => k.slice(2));
  const sig = keys.slice().sort().join(",");

  // step preview — har baar selection badle
  useEffect(() => {
    if (mode !== "step" || !keys.length) return;
    let alive = true;
    rpc("admin", "api.snapto_preview_current_step", { p_campaign: campaignId, p_invites: inv, p_parts: parts }).then(({ data, error }) => {
      if (alive) setPrev(error ? { error: errText(error) } : data || {});
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sig, campaignId]);

  // 📋 ek template sabko — naye Utility templates (Snapto se har 15 min sync)
  useEffect(() => {
    if (mode !== "tpl" || tpls) return;
    rpc("admin", "api.wa_utility_templates", { p_campaign: campaignId }).then(({ data, error }) => {
      if (error) return setTpls({ error: errText(error) });
      const d = data || {};
      setTpls(d);
      const first = (d.templates || []).find((t) => t.ok);
      if (first) setTplName((cur) => cur || first.name);
    });
  }, [mode, tpls, campaignId]);
  const tpl = tpls && tpls.templates ? tpls.templates.find((t) => t.name === tplName) : null;

  const sendTpl = async () => {
    if (!tpl || !tpl.ok) return say("Pick a template first.");
    if (!window.confirm(`Send "${tpl.name}" on WhatsApp to ${keys.length} selected creator${keys.length !== 1 ? "s" : ""}?`)) return;
    setBusy("send");
    const { data: d, error: e } = await rpc("admin", "api.wa_send_template", { p_campaign: campaignId, p_invites: inv, p_parts: parts, p_template: tpl.name });
    setBusy("");
    if (e) return say(errText(e));
    if (d && d.ok === false) return say(d.error || "Could not send.");
    const sk = (d && d.skipped) || [];
    setTpls((t) => ({ ...t, last: d }));
    say(`💬 ${d?.queued ?? 0} creator${d?.queued === 1 ? "" : "s"} will get "${tpl.name}" in a few minutes${sk.length ? ` · ${sk.length} skipped` : ""} ✓`);
    onDone(!!d?.queued);
  };

  // apna message → 24 ghante wali window: wahi creators tick
  const pickOpen = async () => {
    setWin(null);
    const { data, error } = await rpc("admin", "api.campaign_wa_open_windows", { p_campaign: campaignId });
    if (error) return setWin({ error: errText(error) });
    const vis = new Set(visible);
    const open = (Array.isArray(data) ? data : []).filter((x) => vis.has(x.key));
    setWin({ list: open });
    setSel(open.map((x) => x.key.replace(":", "-")));
  };

  const sendStep = async () => {
    setBusy("send");
    const ms = await rpc("admin", "api.campaign_messaging", { p_campaign: campaignId });
    const sw = ms.data || {};
    if (!ms.error && !(sw.wa_on && sw.global_wa_on !== false)) {
      setBusy("");
      return say("WhatsApp is OFF for this campaign — turn it on in Overview first, then send.");
    }
    const { data: d, error: e } = await rpc("admin", "api.snapto_send_current_step", { p_campaign: campaignId, p_invites: inv, p_parts: parts });
    setBusy("");
    if (e) return say(errText(e));
    const sk = (d && d.skipped) || [];
    say(`💬 ${d?.queued ?? 0} creator${d?.queued === 1 ? "" : "s"} will get their step's message in a few minutes${sk.length ? ` · ${sk.length} skipped` : ""} ✓`);
    onDone(!!d?.queued);
  };
  const sendText = async () => {
    if (!text.trim()) return say("Type the message first.");
    setBusy("send");
    const r = await sendWhatsApp({ campaignId, keys, template: null, text: text.trim() });
    setBusy("");
    if (r.cancelled) return;
    say(r.msg);
    onDone(!r.bad?.length && r.ok);
  };

  const groups = prev && prev.groups ? Object.entries(prev.groups) : [];
  const total = groups.reduce((a, [, n]) => a + n, 0);
  const soon = win && win.list && win.list.length ? win.list.map((x) => x.until).sort()[0] : null;

  return (
    <div className="wp">
      <div className="wp-h">
        <b>
          🟢 WhatsApp to {keys.length} selected creator{keys.length !== 1 ? "s" : ""}
        </b>
        <span>WhatsApp only · goes only when you press Send</span>
        <button type="button" className="wp-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className="wp-modes">
        <label className={`wp-mode ${mode === "step" ? "is-on" : ""}`}>
          <input type="radio" checked={mode === "step"} onChange={() => setMode("step")} />
          <span>
            <b>🎯 Each creator&apos;s own step</b>
            <i>Everyone gets the new message of the step they are on — invite, contract, address, courier, video brief, post, completed.</i>
          </span>
        </label>
        <label className={`wp-mode ${mode === "tpl" ? "is-on" : ""}`}>
          <input type="radio" checked={mode === "tpl"} onChange={() => setMode("tpl")} />
          <span>
            <b>📋 One template for everyone</b>
            <i>Pick any new Utility template, see the preview, and send the same one to all selected creators.</i>
          </span>
        </label>
        <label className={`wp-mode ${mode === "text" ? "is-on" : ""}`}>
          <input
            type="radio"
            checked={mode === "text"}
            onChange={() => {
              setMode("text");
              pickOpen();
            }}
          />
          <span>
            <b>✍️ My own message</b>
            <i>Type once — goes as typed to creators who wrote to you in the last 24 hours (WhatsApp&apos;s rule).</i>
          </span>
        </label>
      </div>

      {mode === "step" ? (
        <div className="wp-body">
          {!keys.length ? (
            <p className="wp-mute">Tick creators first.</p>
          ) : !prev ? (
            <p className="wp-mute">Checking what each one would get…</p>
          ) : prev.error ? (
            <p className="wp-err">{prev.error}</p>
          ) : (
            <>
              {groups.map(([k, n]) => (
                <div key={k} className="wp-grp">
                  <b>{n}</b> × {DRIP[k] || `Message ${k}`}
                </div>
              ))}
              {!total && <p className="wp-err">Nothing to send — none of them is on a step with a message right now.</p>}
              {(prev.skipped || []).length > 0 && (
                <details className="wp-skip">
                  <summary>
                    {prev.skipped.length} left out — why
                  </summary>
                  <ul>
                    {prev.skipped.slice(0, 60).map((x, i) => (
                      <li key={i}>
                        {x.who || "Creator"} — {x.why}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      ) : mode === "tpl" ? (
        <div className="wp-body">
          {!tpls ? (
            <p className="wp-mute">Loading templates…</p>
          ) : tpls.error ? (
            <p className="wp-err">{tpls.error}</p>
          ) : !(tpls.templates || []).length ? (
            <p className="wp-err">No new Utility templates found yet — they sync from Snapto every 15 minutes.</p>
          ) : (
            <>
              <select className="ga-input wp-sel" value={tplName} onChange={(e) => setTplName(e.target.value)}>
                <option value="">— Pick a template —</option>
                {tpls.templates.map((t) => (
                  <option key={t.name} value={t.name} disabled={!t.ok}>
                    {t.name}
                    {t.header === "IMAGE" ? " 🖼" : ""}
                    {!t.ok ? ` — ${t.why || "not for bulk"}` : ""}
                  </option>
                ))}
              </select>
              {tpl && (
                <div className="wp-prev">
                  {tpl.header === "IMAGE" &&
                    (tpls.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tpls.photo} alt="" className="wp-prev-img" />
                    ) : (
                      <div className="wp-prev-noimg">🖼 Photo template — tick &quot;WhatsApp invite with photo&quot; and add a photo in Edit brief first.</div>
                    ))}
                  <div className="wp-prev-body">{fillTpl(tpl.body, tpl.roles, tpls.campaign)}</div>
                  <div className="wp-prev-foot">Reply STOP to stop all messages</div>
                  {tpl.url_button && <div className="wp-prev-btn">🔗 {tpl.url_button}</div>}
                  {(tpl.quick || []).map((qr) => (
                    <div key={qr} className="wp-prev-btn">↩ {qr}</div>
                  ))}
                </div>
              )}
              <p className="wp-mute">Preview uses a sample name (Asha). Each creator gets their own name and their own link. Opted-out (STOP) numbers are skipped.</p>
              {tpls.last && (tpls.last.skipped || []).length > 0 && (
                <details className="wp-skip">
                  <summary>{tpls.last.skipped.length} left out — why</summary>
                  <ul>
                    {tpls.last.skipped.slice(0, 60).map((x, i) => (
                      <li key={i}>
                        {x.who || "Creator"} — {x.why}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="wp-body">
          {!win ? (
            <p className="wp-mute">Checking who replied in the last 24 hours…</p>
          ) : win.error ? (
            <p className="wp-err">Couldn&apos;t check: {win.error}</p>
          ) : win.list.length ? (
            <p className="wp-win">
              💬 <b>{win.list.length}</b> creator{win.list.length !== 1 ? "s" : ""} on this list wrote to you in the last 24 hours — ticked automatically, everyone else removed.
              {soon ? ` First window closes ${fdt(soon)}.` : ""}
            </p>
          ) : (
            <p className="wp-err">Nobody on this list wrote to you in the last 24 hours. WhatsApp only lets a typed message go inside that window — use 🎯 their step instead.</p>
          )}
          <textarea className="ga-input wp-ta" rows={4} maxLength={900} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the WhatsApp message…" />
          <p className="wp-mute">Goes exactly as you type it — no template.</p>
        </div>
      )}

      <div className="wp-foot">
        <button type="button" className="ga-btn ga-btn--primary wp-go" disabled={!keys.length || busy === "send" || (mode === "step" ? !total : mode === "tpl" ? !(tpl && tpl.ok && (tpl.header !== "IMAGE" || tpls.photo)) : !(win && win.list && win.list.length))} onClick={mode === "step" ? sendStep : mode === "tpl" ? sendTpl : sendText}>
          {busy === "send" ? "Sending…" : `➤ Send on WhatsApp to ${mode === "step" ? total : keys.length}`}
        </button>
      </div>
      <style>{`
        .wp { margin-top: 12px; padding: 14px 16px; border-radius: 14px; border: 1px solid #b7e3c6; background: #f3fbf6; }
        .wp-h { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 14px; color: var(--ad-ink); }
        .wp-h span { font-size: 12px; color: var(--ad-muted); }
        .wp-x { margin-left: auto; border: 0; background: none; font-size: 16px; color: var(--ad-muted); cursor: pointer; }
        .wp-modes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 10px; }
        .wp-sel { height: 40px; }
        .wp-prev { max-width: 360px; padding: 8px; border-radius: 12px; background: #dcf8c6; border: 1px solid #c4e8a8; display: flex; flex-direction: column; gap: 6px; }
        .wp-prev-img { width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; }
        .wp-prev-noimg { padding: 10px; border-radius: 8px; background: #fff7e6; color: #b45309; font-size: 12px; }
        .wp-prev-body { white-space: pre-wrap; font-size: 13px; color: #111; line-height: 1.45; }
        .wp-prev-foot { font-size: 11px; color: #667; }
        .wp-prev-btn { text-align: center; padding: 7px; border-radius: 8px; background: #fff; color: #0b84d8; font-size: 12.5px; font-weight: 600; }
        .wp-mode { display: flex; gap: 8px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--ad-line); background: #fff; cursor: pointer; font-size: 13px; }
        .wp-mode.is-on { border-color: #22a35a; box-shadow: 0 0 0 2px rgba(34,163,90,.15); }
        .wp-mode span { display: flex; flex-direction: column; gap: 3px; }
        .wp-mode i { font-style: normal; font-size: 12px; color: var(--ad-muted); line-height: 1.4; }
        .wp-body { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
        .wp-grp { padding: 7px 10px; border-radius: 9px; background: #fff; border: 1px solid var(--ad-line); }
        .wp-grp b { color: #15803d; }
        .wp-skip summary { cursor: pointer; font-weight: 700; color: #b45309; }
        .wp-skip ul { margin: 6px 0 0 18px; font-size: 12.5px; color: var(--ad-muted); }
        .wp-mute { font-size: 12px; color: var(--ad-muted); }
        .wp-err { padding: 8px 10px; border-radius: 9px; background: #ffeef0; color: #b64455; font-size: 12.5px; }
        .wp-win { padding: 8px 10px; border-radius: 9px; background: #e8f7ee; color: #166534; font-size: 12.5px; }
        .wp-ta { height: auto; min-height: 90px; padding: 10px 12px; }
        .wp-foot { margin-top: 10px; }
        .wp-go { height: 40px; padding: 0 16px; background: #16a34a; border-color: #16a34a; }
        @media (max-width: 700px) { .wp-modes { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
