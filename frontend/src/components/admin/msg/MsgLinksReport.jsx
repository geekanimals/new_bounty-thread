"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";

/* 💬 Links in WhatsApp / email messages — purane adminShortLinks jaisa (api.admin_short_links_report / admin_set_short_links) */
const secs = (v) => (v == null ? "—" : v < 60 ? `${v}s` : `${Math.floor(v / 60)}m ${String(v % 60).padStart(2, "0")}s`);
const pct = (a, b) => (b ? Math.round((100 * a) / b) + "%" : "—");
const kind = (k) => String(k || "other").replace(/_/g, " ").replace(/^geek /, "");
const fdt = (v) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");

export default function MsgLinksReport() {
  const [days, setDays] = useState(7);
  const [msg, setMsg] = useState("");
  const r = useRpc("admin", "api.admin_short_links_report", { p_days: days });
  const d = r.data || {};
  const t = d.totals || {};
  const on = d.on !== false;
  const dev = Object.entries(d.by_device || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} ${n}`)
    .join(" · ");
  const toggle = async () => {
    const { error } = await rpc("admin", "api.admin_set_short_links", { p_on: !on });
    setMsg(error ? errText(error) : !on ? "🔗 Short links ON ✓" : "Short links OFF — new messages carry the full link");
    r.reload(true);
  };
  return (
    <section className="ga-card mlr">
      <div className="mlr-h">
        <h3 className="ga-h2">💬 Links in WhatsApp / email messages</h3>
        <select className="ga-input mlr-sel" value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Period">
          {[1, 7, 30, 90].map((n) => (
            <option key={n} value={n}>
              Last {n === 1 ? "24 hours" : `${n} days`}
            </option>
          ))}
        </select>
      </div>
      <p className="mlr-mute">Every link in a WhatsApp / email message goes out short. A click is logged with the device and how long after the message it came; on our own pages the time they stayed — and how long they were active — is logged too. Link-preview bots are not counted.</p>
      {r.error ? (
        <p className="mlr-mute">{errText(r.error)}</p>
      ) : (
        <>
          <label className="mlr-sw">
            <input type="checkbox" checked={on} onChange={toggle} /> <b>🔗 Short links + tracking</b> — {on ? "new messages carry short links" : "new messages carry the full link — nothing is tracked"}
          </label>
          {msg && <p className="mlr-mute">{msg}</p>}
          <div className="mlr-kpis">
            <div>
              <b>{t.links || 0}</b>links sent
            </div>
            <div>
              <b>{t.clicked || 0}</b>opened · {pct(t.clicked || 0, t.links || 0)}
            </div>
            <div>
              <b>{t.clicks || 0}</b>clicks · {t.people || 0} people
            </div>
            <div>
              <b>{secs(t.avg_seconds)}</b>avg time on page
            </div>
            <div>
              <b>{secs(t.avg_active)}</b>avg active (mouse / touch)
            </div>
            <div>
              <b>{t.median_minutes_to_click != null ? t.median_minutes_to_click + "m" : "—"}</b>median time to click
            </div>
          </div>
          <p className="mlr-mute">
            Devices: {dev || "—"}
            {t.bots ? ` · ${t.bots} link-preview bot hits not counted` : ""}
          </p>
          {(d.by_message || []).length ? (
            <div className="c2-tw">
              <table className="c2-t">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Channel</th>
                    <th>Sent</th>
                    <th>Opened</th>
                    <th>Rate</th>
                    <th>Avg time</th>
                  </tr>
                </thead>
                <tbody>
                  {d.by_message.map((x, i) => (
                    <tr key={i}>
                      <td>{kind(x.kind)}</td>
                      <td>{x.channel === "email" ? "✉️" : "💬"}</td>
                      <td>{x.sent}</td>
                      <td>{x.clicked}</td>
                      <td>{x.ctr}%</td>
                      <td>{secs(x.avg_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mlr-mute">{r.loading ? "Loading…" : "No links sent in this period yet."}</p>
          )}
          {(d.recent || []).length > 0 && (
            <>
              <p className="mlr-sub">Recent clicks</p>
              <div className="c2-tw">
                <table className="c2-t">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Who</th>
                      <th>Message</th>
                      <th>Campaign</th>
                      <th>Device</th>
                      <th>Clicked after</th>
                      <th>Time on page</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recent.map((x, i) => (
                      <tr key={i}>
                        <td>{fdt(x.at)}</td>
                        <td>{x.who || "—"}</td>
                        <td>
                          {x.channel === "email" ? "✉️" : "💬"} {kind(x.kind)}
                        </td>
                        <td>{x.campaign || "—"}</td>
                        <td>{[x.os, x.browser].filter(Boolean).join(" · ") || x.device || "—"}</td>
                        <td>{x.minutes_after_send != null ? (x.minutes_after_send < 60 ? x.minutes_after_send + "m" : Math.round(x.minutes_after_send / 60) + "h") : "—"}</td>
                        <td>{secs(x.seconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
      <style>{`
        .mlr { padding: 20px 22px; margin-top: 18px; }
        .mlr-h { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .mlr-sel { width: auto; height: 38px; padding: 0 10px; }
        .mlr-mute { font-size: 12.5px; color: var(--ad-muted); margin-top: 6px; line-height: 1.5; }
        .mlr-sw { display: flex; gap: 8px; align-items: center; margin-top: 10px; font-size: 13.5px; cursor: pointer; }
        .mlr-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
        .mlr-kpis div { display: flex; flex-direction: column; padding: 10px; border-radius: 10px; border: 1px solid var(--ad-line); font-size: 11.5px; color: var(--ad-muted); }
        .mlr-kpis b { font-size: 18px; color: var(--ad-ink); }
        .mlr-sub { margin-top: 14px; font-weight: 800; font-size: 13px; }
        @media (max-width: 900px) { .mlr-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </section>
  );
}
