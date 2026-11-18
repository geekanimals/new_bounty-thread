"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { INVITE_STEPS } from "@/components/admin/campaign/live";
import { buildRows } from "@/components/admin/campaign/journey";
import { when } from "@/components/admin/campaign2/kit";

/*
 * Upload history — purane bkHistHtml jaisa: har upload mein
 *  ⚠️ jo rows nahi gayi (row, naam, Instagram, number, step, kyun) · 🔁 duplicates
 *  aur us upload ke creators unke ABHI ke step ke groups mein — har group par Resend / WhatsApp / Download.
 * WhatsApp = har creator ko uske abhi ke step ka ek naya Utility message (snapto_send_current_step).
 */
const GROUPS = [
  ["nog", "Not on Geek yet", "invite sent · not registered", "#8b5cf6"],
  ["noig", "Registered — joining", "on Geek OS · finishing sign-up", "#6366f1"],
  ["pre", "Screening & brand", "screen · brand's list · brand's answer", "#0ea5e9"],
  ["contract", "Contract & address", "sign the contract · confirm the address", "#14b8a6"],
  ["ship", "Shipping", "add courier · in transit", "#f59e0b"],
  ["video", "Making the video", "video due", "#ef4444"],
  ["review", "Review the video", "your turn", "#f97316"],
  ["topost", "Approved — to post", "waiting for the post", "#a855f7"],
  ["posting", "Posting", "posts / stories left", "#3b82f6"],
  ["done", "Done", "every post up", "#22c55e"],
  ["out", "Out of the campaign", "not selected / dropped", "#94a3b8"],
];
function groupOf(r) {
  if (!r) return null;
  if (r.kind === "i") {
    if (r.i?.status === "posted") return "done";
    return r.registered ? "noig" : "nog";
  }
  const x = r.x || {};
  const s = x.stage;
  const ship = x.shipment || {};
  if (["dropped", "rejected", "ineligible", "brand_declined"].includes(s)) return "out";
  if (x.blocked_at) return "video";
  if (["invited", "shortlisted", "applied", "eligible", "sent_to_brand", "brand_confirmed", "accepted"].includes(s)) return "pre";
  if (["contract_sent", "contract_signed"].includes(s)) return "contract";
  if (s === "address_confirmed" || (s === "product_sent" && ship.status !== "delivered")) return "ship";
  if (["product_sent", "content_created", "changes_requested"].includes(s)) return "video";
  if (s === "content_submitted") return "review";
  if (s === "content_approved") return "topost";
  if (s === "published") return "posting";
  if (s === "completed") return "done";
  return "pre";
}
const stLabel = (k) => (INVITE_STEPS.find((s) => s[0] === k) || [k, k])[1];
const igOf = (h) =>
  h
    ? "@" +
      String(h)
        .replace(/^@/, "")
        .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, "")
        .replace(/[/?#].*$/, "")
    : "—";

export default function UploadHistory({ id, kind, ups, onDownload, show }) {
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !ups.length });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !ups.length });
  const [openAll, setOpenAll] = useState({});
  const [busy, setBusy] = useState("");
  const rows = useMemo(() => buildRows({ tracker: bt.data, people: people.data, progress: {}, kind: kind || "barter" }), [bt.data, people.data, kind]);
  const byP = useMemo(() => Object.fromEntries(rows.filter((r) => r.kind === "p").map((r) => [r.pid, r])), [rows]);
  const byI = useMemo(() => Object.fromEntries(rows.filter((r) => r.kind === "i").map((r) => [r.iid, r])), [rows]);
  const reload = () => {
    bt.reload(true);
    people.reload(true);
  };

  const rowOf = (c) => (c.participation_id && byP[c.participation_id]) || (c.invite_id && byI[c.invite_id]) || (c.invite_id && rows.find((r) => r.kind === "p" && r.x?.invite_id === c.invite_id)) || null;

  const waAll = async (list, tag) => {
    const inv = list.filter((r) => r.kind === "i").map((r) => r.iid);
    const parts = list.filter((r) => r.kind === "p").map((r) => r.pid);
    if (!window.confirm(`Send ${list.length} creator${list.length > 1 ? "s" : ""} the WhatsApp for the step each one is on right now? One message each — steps with no message are skipped.`)) return;
    setBusy(tag);
    const { data: d, error } = await rpc("admin", "api.snapto_send_current_step", { p_campaign: id, p_invites: inv, p_parts: parts });
    setBusy("");
    if (error) return show(errText(error));
    const sk = (d && d.skipped) || [];
    show(`🟢 ${d?.queued || 0} WhatsApp queued${sk.length ? ` · ${sk.length} skipped (${sk[0]?.why || "no message for that step"})` : ""}`);
    reload();
  };
  const resend = async (list, tag) => {
    const inv = list.filter((r) => r.kind === "i" && !r.registered);
    if (!inv.length) return show("Everyone here has registered.");
    if (!window.confirm(`Resend the invite to ${inv.length} creator${inv.length > 1 ? "s" : ""} who haven’t registered yet?`)) return;
    setBusy(tag);
    let ok = 0;
    let last = null;
    for (const r of inv) {
      const { error } = await rpc("admin", "api.bulk_resend_invite", { p_invite: r.iid });
      if (error) last = error;
      else ok++;
    }
    setBusy("");
    show(last ? `${ok} re-sent · ${errText(last)}` : `↻ Invite re-sent to ${ok}`);
    reload();
  };

  const tot = ups.reduce((a, u) => a + (u.new_count || 0), 0);
  const loading = bt.loading || people.loading;

  return (
    <div className="uh">
      <p className="uh-sum">
        <b>{ups.length}</b> upload{ups.length > 1 ? "s" : ""} · <b>{tot}</b> creator{tot !== 1 ? "s" : ""} came in this way
        {loading && <span className="uh-muted"> · loading creators…</span>}
      </p>
      {ups.map((u, k) => {
        const nuAll = u.not_uploaded || [];
        const isRep = (x) => /^(Repeat|Already in)/.test(x.reason || "");
        const nu = nuAll.filter((x) => !isRep(x));
        const rep = nuAll.filter(isRep);
        const items = u.items || [];
        const seen = new Map();
        items.forEach((c) => {
          const r = rowOf(c);
          if (r && !seen.has(r.id)) seen.set(r.id, { c, r });
        });
        const G = {};
        seen.forEach((e) => {
          const g = groupOf(e.r);
          if (g) (G[g] = G[g] || []).push(e);
        });
        const shown = GROUPS.filter(([g]) => (G[g] || []).length);
        const allRows = [...seen.values()].map((e) => e.r);
        const nNew = items.filter((c) => c.action === "new").length;
        return (
          <details key={u.batch_id || u.at || k} className="uh-up" open={k === 0}>
            <summary>
              📅 {when(u.at)} <span className="uh-muted">· by {u.who || "—"}</span>
              <span className="uh-bits">
                {nu.length > 0 && <b className="uh-red">⚠️ {nu.length} not uploaded</b>}
                {u.new_count ? <span><b>{u.new_count}</b> new</span> : null}
                {u.updated_count ? <span><b>{u.updated_count}</b> updated</span> : null}
                {(rep.length || u.duplicates) > 0 && <b className="uh-amber">🔁 {rep.length || u.duplicates} duplicate{(rep.length || u.duplicates) > 1 ? "s" : ""}</b>}
                {u.skipped && !nu.length ? <span>{u.skipped} skipped</span> : null}
              </span>
              {k === 0 && <span className="ga-badge ga-badge--violet">latest</span>}
            </summary>

            {[
              [nu, "⚠️ Not uploaded", "these rows of the sheet didn't go, and why:", "uh-red"],
              [rep, "🔁 Duplicates / already in", "the same person again, so not added twice:", "uh-amber"],
            ].map(([list, t, s, cls]) =>
              list.length ? (
                <div key={t} className="uh-nu">
                  <p className={cls}>
                    <b>
                      {t} ({list.length})
                    </b>{" "}
                    — {s}
                  </p>
                  <div className="uh-tw">
                    <table className="c2-t uh-t">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Name</th>
                          <th>Instagram</th>
                          <th>WhatsApp · email</th>
                          <th>Step in sheet</th>
                          <th>Why</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((x, i) => (
                          <tr key={i}>
                            <td>{x.row || "—"}</td>
                            <td>{x.name || "—"}</td>
                            <td>{igOf(x.handle)}</td>
                            <td>{[x.phone, x.email].filter(Boolean).join(" · ") || "—"}</td>
                            <td>{x.status ? stLabel(x.status) : "—"}</td>
                            <td className="uh-why">{x.reason || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null
            )}

            {allRows.length > 0 ? (
              <>
                <div className="uh-acts">
                  <span className="uh-muted">
                    {allRows.length} creator{allRows.length > 1 ? "s" : ""} · {nNew} new · {items.length - nNew} updated
                  </span>
                  <span className="uh-sp" />
                  <button type="button" className="ga-btn ga-btn--ghost uh-b" onClick={() => onDownload(allRows.map((r) => r.id))}>
                    ⬇ Download
                  </button>
                  <button type="button" className="ga-btn ga-btn--primary uh-b" disabled={busy === "u" + k} onClick={() => waAll(allRows, "u" + k)}>
                    {busy === "u" + k ? "Sending…" : `🟢 WhatsApp all ${allRows.length}`}
                  </button>
                </div>
                <div className="uh-tiles">
                  {shown.map(([g, l, , col]) => (
                    <a key={g} href={`#uh-${k}-${g}`} className="uh-tile" style={{ "--c": col }}>
                      <b>{G[g].length}</b>
                      <span>{l}</span>
                    </a>
                  ))}
                </div>
                {shown.map(([g, l, sub, col]) => {
                  const list = G[g];
                  const gid = `${k}-${g}`;
                  const lim = openAll[gid] ? list.length : 5;
                  const today = new Date().toISOString().slice(0, 10);
                  const od = g === "video" ? list.filter((e) => e.r.x?.due_on && e.r.x.due_on < today).length : 0;
                  return (
                    <details key={g} id={`uh-${gid}`} className="uh-grp" style={{ "--c": col }} open>
                      <summary>
                        <b>{l}</b> <span className="uh-n">{list.length}</span> <span className="uh-muted">{od ? `${od} overdue` : sub}</span>
                      </summary>
                      <div className="uh-acts">
                        <span className="uh-sp" />
                        {g === "nog" && (
                          <button type="button" className="ga-btn ga-btn--ghost uh-b" disabled={busy === "r" + gid} onClick={() => resend(list.map((e) => e.r), "r" + gid)}>
                            {busy === "r" + gid ? "Sending…" : `↻ Resend invite to ${list.length}`}
                          </button>
                        )}
                        <button type="button" className="ga-btn ga-btn--ghost uh-b" onClick={() => onDownload(list.map((e) => e.r.id))}>
                          ⬇ Download
                        </button>
                        {g !== "out" && (
                          <button type="button" className="ga-btn ga-btn--primary uh-b" disabled={busy === "w" + gid} onClick={() => waAll(list.map((e) => e.r), "w" + gid)}>
                            {busy === "w" + gid ? "Sending…" : `🟢 WhatsApp all ${list.length}`}
                          </button>
                        )}
                      </div>
                      <div className="uh-list">
                        {list.slice(0, lim).map(({ c, r }) => (
                          <Link key={r.id} href={`/vault/campaigns/${id}/creators/${r.id}`} className="uh-card">
                            <span className="uh-av">{(r.name || "?").replace(/^@/, "").slice(0, 1).toUpperCase()}</span>
                            <span className="uh-main">
                              <b>{r.name}</b> {r.handle && r.handle !== r.name ? <em>{r.handle}</em> : null}
                              <small>
                                Step {r.step}/12 · {r.stepNote}
                              </small>
                              <small className={c.action === "new" ? "uh-new" : "uh-upd"}>
                                {c.action === "new" ? "🆕 New in this upload" : "✏️ Updated by this upload"}
                                {c.sheet_status ? ` · sheet said “${stLabel(c.sheet_status)}”` : ""}
                              </small>
                            </span>
                            <span className="uh-open">Open ›</span>
                          </Link>
                        ))}
                      </div>
                      {list.length > lim && (
                        <button type="button" className="uh-more" onClick={() => setOpenAll((o) => ({ ...o, [gid]: true }))}>
                          + {list.length - lim} more in this group · Show all
                        </button>
                      )}
                    </details>
                  );
                })}
              </>
            ) : (
              <p className="uh-muted uh-pad">{loading ? "Loading creators…" : "No creators to show for this upload."}</p>
            )}
          </details>
        );
      })}
      <style>{`
        .uh { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
        .uh-sum { font-size: 13px; color: var(--ad-ink); }
        .uh-muted { color: var(--ad-muted); font-size: 12.5px; }
        .uh-up { border: 1px solid var(--ad-line); border-radius: 14px; padding: 12px 14px; background: #fff; }
        .uh-up > summary { cursor: pointer; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 800; color: var(--ad-ink); }
        .uh-bits { display: inline-flex; flex-wrap: wrap; gap: 10px; font-weight: 600; font-size: 12.5px; color: var(--ad-muted); }
        .uh-red { color: #dc2626; }
        .uh-amber { color: #b45309; }
        .uh-nu { margin-top: 12px; font-size: 12.5px; }
        .uh-tw { overflow-x: auto; margin-top: 6px; }
        .uh-t td { white-space: normal; font-size: 12.5px; }
        .uh-why { color: #b64455; font-weight: 700; }
        .uh-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
        .uh-sp { flex: 1; }
        .uh-b { height: 36px; padding: 0 13px; font-size: 13px; }
        .uh-tiles { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .uh-tile { display: flex; flex-direction: column; min-width: 120px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--ad-line); border-left: 4px solid var(--c); text-decoration: none; }
        .uh-tile b { font-size: 20px; color: var(--ad-ink); }
        .uh-tile span { font-size: 12px; color: var(--ad-muted); }
        .uh-grp { margin-top: 12px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--ad-line); border-left: 4px solid var(--c); }
        .uh-grp > summary { cursor: pointer; font-size: 13px; color: var(--ad-ink); }
        .uh-n { display: inline-grid; place-items: center; min-width: 22px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--ad-soft-2); font-size: 11.5px; font-weight: 800; }
        .uh-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .uh-card { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; border: 1px solid var(--ad-line); text-decoration: none; color: var(--ad-ink); }
        .uh-card:hover { border-color: var(--ad-primary); }
        .uh-av { width: 32px; height: 32px; flex-shrink: 0; display: grid; place-items: center; border-radius: 9px; background: var(--ad-soft); font-weight: 800; }
        .uh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
        .uh-main em { font-style: normal; color: var(--ad-muted); font-size: 12px; }
        .uh-main small { font-size: 11.5px; color: var(--ad-muted); }
        .uh-new { color: #15803d !important; }
        .uh-open { font-size: 12.5px; font-weight: 800; color: #6657e9; white-space: nowrap; }
        .uh-more { margin-top: 8px; border: 0; background: none; font-size: 12.5px; font-weight: 800; color: #6657e9; cursor: pointer; }
        .uh-pad { padding: 10px 0 2px; }
      `}</style>
    </div>
  );
}
