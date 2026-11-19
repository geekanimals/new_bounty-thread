"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { startDraftFromRequest } from "@/components/admin/campaign/Wizard";

/*
 * Brand portal ke andar ki cheezein — purane bcPaintPortal / bcPaintPicks jaisa:
 *  🔔 email alerts (admin_brand_notify) · 📝 campaign requests (Full brief · 🚀 Create campaign · status)
 *  ⭐ creators they saved · 🔎 shortlisted from Discovery (🎯 Invite · Decline · Reopen)
 */
const RS = { new: "New", in_review: "In review", converted: "Converted", declined: "Declined" };
const TYPE = { barter: "Barter", paid: "Paid", barter_paid: "Barter + Paid", visit: "Physical visit" };
const nf = (n) => (n == null ? "" : Number(n).toLocaleString("en-IN"));
const fd = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");

export default function PortalExtras({ b, portal, say }) {
  const router = useRouter();
  const d = portal.data || {};
  const Q = d.requests || [];
  const F = d.saved || [];
  const picks = useRpc("admin", "api.admin_brand_picks", { p_brand: b.brand_id }, { skip: !b.brand_id });
  const [brief, setBrief] = useState(null);
  const [busy, setBusy] = useState("");

  const notify = async (on) => {
    const { error } = await rpc("admin", "api.admin_brand_notify", { p_brand: b.brand_id, p_on: on });
    say(error ? errText(error) : on ? "Email alerts on ✓" : "Email alerts off");
    portal.reload(true);
  };
  const setReq = async (q, st) => {
    const note = st === "declined" ? window.prompt("Note for the brand (optional):", "") : null;
    if (st === "declined" && note === null) return;
    const { error } = await rpc("admin", "api.admin_campaign_request_set", { p_request: q.request_id, p_status: st, p_note: note || null });
    say(error ? errText(error) : `Request → ${RS[st]} ✓`);
    portal.reload(true);
  };
  const make = (q) => {
    startDraftFromRequest(q, b);
    router.push("/vault/campaigns/new/basics");
  };
  const pickSet = async (k, st, note) => {
    const { error } = await rpc("admin", "api.admin_brand_pick_set", { p_pick: k.pick_id, p_status: st, p_note: note || null });
    if (error) {
      say(errText(error));
      return false;
    }
    return true;
  };
  const pickInvite = async (k) => {
    setBusy(k.pick_id);
    const { data: r, error } = await rpc("admin", "api.invite_external", { p_campaign: k.campaign_id, p_handle: k.handle, p_note: k.note || null });
    if (error) {
      setBusy("");
      return say(errText(error));
    }
    await pickSet(k, "invited");
    setBusy("");
    say(r && r.on_platform ? `✅ @${k.handle} invited — they see it in the app` : `✅ @${k.handle} added to the campaign's invite list — send the DM from the campaign's Find creators`);
    picks.reload(true);
  };

  const ff = (brief && brief.form) || {};
  const ct = ff.contract_terms || {};
  const vb = ff.video_brief || {};
  const ip = ff.ideal_profile || {};
  const R = (k, v) => (v != null && v !== "" && !(Array.isArray(v) && !v.length) ? (
    <div className="px-row" key={k}>
      <span>{k}</span>
      <div>{Array.isArray(v) ? v.join(", ") : String(v)}</div>
    </div>
  ) : null);

  return (
    <div className="px">
      <div className="px-card">
        <p className="px-h">🔔 Alerts for {b.name}&apos;s team</p>
        <label className="px-chk">
          <input type="checkbox" checked={!!d.notify_email} onChange={(e) => notify(e.target.checked)} /> <b>Email alerts</b> — “N creators waiting for approval”, “N new videos ready for review” (at most one email an hour), “Campaign report ready”
        </label>
        <p className="px-mute">In-app alerts (the 🔔 in their dashboard) always go. Email also needs the email switch ON in Settings.</p>
      </div>

      <div className="px-card">
        <p className="px-h">📝 Campaign requests ({Q.length})</p>
        {Q.length ? (
          Q.map((q) => (
            <div key={q.request_id} className="px-item">
              <div className="px-main">
                <b>{q.name}</b> <span className={`ga-badge ${q.status === "new" ? "ga-badge--orange" : q.status === "converted" ? "ga-badge--green" : ""}`}>{RS[q.status] || q.status}</span>
                <p className="px-mute">{[fd(q.created_at), q.by ? "by " + q.by : "", TYPE[q.campaign_type] || q.campaign_type, q.creators_needed ? q.creators_needed + " creators" : "", q.budget, q.starts_on && q.ends_on ? `${q.starts_on} → ${q.ends_on}` : "", q.cities].filter(Boolean).join(" · ")}</p>
                {q.product && <p>🎁 {q.product}</p>}
                {q.deliverables && <p>📦 {q.deliverables}</p>}
                {q.brief && <p className="px-pre">{q.brief}</p>}
                {q.admin_note && <p className="px-mute">Note to brand: {q.admin_note}</p>}
              </div>
              <div className="px-acts">
                {q.form && (
                  <button type="button" className="ga-btn ga-btn--ghost px-b" onClick={() => setBrief(q)}>
                    📄 Full brief
                  </button>
                )}
                {q.status !== "converted" ? (
                  <button type="button" className="ga-btn ga-btn--primary px-b" onClick={() => make(q)}>
                    🚀 Create campaign
                  </button>
                ) : q.campaign_id ? (
                  <span className="ga-badge ga-badge--green">Campaign made</span>
                ) : null}
                <select className="ga-input px-sel" value={q.status} onChange={(e) => setReq(q, e.target.value)} aria-label="Request status">
                  {Object.entries(RS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        ) : (
          <p className="px-mute">No requests yet — the brand sends them from its dashboard (➕ Request a new campaign).</p>
        )}
      </div>

      <div className="px-card">
        <p className="px-h">⭐ Creators they saved ({F.length})</p>
        {F.length ? (
          F.map((f, i) => {
            const c = f.creator || {};
            return (
              <div key={i} className="px-item">
                <div className="px-main">
                  <b>{c.username ? "@" + c.username : c.name || "Creator"}</b>
                  <p className="px-mute">{[c.followers != null ? nf(c.followers) + " followers" : "", c.city, f.campaigns].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-mute">None yet.</p>
        )}
      </div>

      <div className="px-card">
        <p className="px-h">🔎 Shortlisted from Discovery</p>
        {picks.error ? (
          <p className="px-mute">{errText(picks.error)}</p>
        ) : !(picks.data || []).length ? (
          <p className="px-mute">{picks.loading ? "Loading…" : `Nothing yet — ${b.name} shortlists creators from 🔎 Discovery in their dashboard.`}</p>
        ) : (
          (picks.data || []).map((k) => {
            const s0 = k.snapshot || {};
            const ST = { new: ["New", "ga-badge--orange"], invited: ["Invited", "ga-badge--green"], declined: ["Declined", ""] }[k.status] || [k.status, ""];
            return (
              <div key={k.pick_id} className="px-item">
                <div className="px-main">
                  <a href={`https://instagram.com/${encodeURIComponent(k.handle)}`} target="_blank" rel="noopener noreferrer">
                    <b>@{k.handle}</b>
                  </a>{" "}
                  <span className={`ga-badge ${ST[1]}`}>{ST[0]}</span>
                  {s0.on_geek && <span className="ga-badge ga-badge--green">On Geek OS</span>}
                  {k.on_campaign && <span className="ga-badge">{String(k.on_campaign).replace(/_/g, " ")}</span>}
                  <p className="px-mute">
                    {[s0.followers != null ? nf(s0.followers) + " followers" : "", s0.engagement != null ? Math.round(s0.engagement * 10) / 10 + "% ER" : "", s0.city, k.campaign ? "for " + k.campaign : "no campaign picked", fd(k.added_at), k.by ? "by " + k.by : ""].filter(Boolean).join(" · ")}
                  </p>
                  {k.note && <p>📝 {k.note}</p>}
                </div>
                <div className="px-acts">
                  {k.status === "new" ? (
                    <>
                      {k.campaign_id && (
                        <button type="button" className="ga-btn ga-btn--primary px-b" disabled={busy === k.pick_id} onClick={() => pickInvite(k)}>
                          {busy === k.pick_id ? "Inviting…" : `🎯 Invite to ${k.campaign}`}
                        </button>
                      )}
                      <button
                        type="button"
                        className="ga-btn ga-btn--ghost px-b"
                        onClick={async () => {
                          const note = window.prompt("Note for the brand (optional) — e.g. over budget, not available:", "");
                          if (note === null) return;
                          if (await pickSet(k, "declined", note)) {
                            say("Declined — the brand is told");
                            picks.reload(true);
                          }
                        }}
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button type="button" className="ga-btn ga-btn--ghost px-b" onClick={async () => (await pickSet(k, "new")) && picks.reload(true)}>
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {brief && (
        <div className="ga-overlay" onClick={() => setBrief(null)}>
          <div className="ga-modal px-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Full brief">
            <h2 className="ga-h2">
              📄 {brief.name} — {b.name}&apos;s request
            </h2>
            {R("Type", TYPE[ff.campaign_type] || ff.campaign_type)}
            {R("Objective", ff.objective)}
            {R("Creators", ff.creators)}
            {R("Budget (₹)", ff.budget)}
            {R("Product link", ff.product_link)}
            {R("Product value (₹)", ff.product_value)}
            {R("Deliverables", ff.deliverables)}
            {R("Hashtags & mentions", ff.hashtags)}
            {R("Dates", ff.start_date || ff.end_date ? `${ff.start_date || "—"} → ${ff.end_date || "—"}` : "")}
            {R("Brief", ff.brief)}
            {(ff.attachments || []).length > 0 && (
              <div className="px-row">
                <span>Files</span>
                <div>
                  {ff.attachments.map((a, i) => (
                    <a key={i} href={/^https?:\/\//.test(a.url || "") ? a.url : "#"} target="_blank" rel="noopener noreferrer">
                      📎 {a.name}
                      <br />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="px-sec">📜 Contract terms</p>
            {R("Product the creator gets", ct.product)}
            {R("Content due (days)", ct.content_days)}
            {R("Ad rights (months)", ct.ad_rights_months)}
            {R("Collab rights", ct.collab_rights ? "Yes" : ct.collab_rights === false ? "No" : "")}
            {R("Non-delivery = blacklist", ct.blacklist_clause ? "Yes" : ct.blacklist_clause === false ? "No" : "")}
            {R("Other terms", ct.extra_terms)}
            {R("Pay fee (days after posts)", ct.pay_due_days)}
            <p className="px-sec">🎬 Video brief</p>
            {R("What to shoot", vb.what_to_shoot)}
            {R("Key messages", vb.key_messages)}
            {R("Do's", vb.dos)}
            {R("Don'ts", vb.donts)}
            {R("Caption", vb.caption)}
            {R("References", vb.reference_links)}
            {R("Posting note", vb.posting_note)}
            <p className="px-sec">✅ Who can apply</p>
            {R("Followers", ip.min_followers != null || ip.max_followers != null ? `${ip.min_followers != null ? nf(ip.min_followers) : "Any"} – ${ip.max_followers != null ? nf(ip.max_followers) : "Any"}` : "")}
            {R("Locations", ip.locations)}
            {R("Gender", ip.gender)}
            {R("Categories", ip.categories)}
            {R("Min engagement %", ip.min_engagement)}
            {R("Age", ip.age_min || ip.age_max ? `${ip.age_min || "Any"} – ${ip.age_max || "Any"}` : "")}
            {R("Pet", ip.pet)}
            {R("Pet type", ip.pet_type)}
            {R("Married", ip.marital)}
            {R("Open to barter", ip.barter)}
            {R("Audience notes", ip.audience_notes)}
            <div className="px-mact">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setBrief(null)}>
                Close
              </button>
              {brief.status !== "converted" && (
                <button type="button" className="ga-btn ga-btn--primary" onClick={() => make(brief)}>
                  🚀 Create this campaign
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .px { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
        .px-card { padding: 14px 16px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; }
        .px-h { font-size: 14px; font-weight: 800; color: var(--ad-ink); margin-bottom: 8px; }
        .px-chk { display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; color: var(--ad-ink); cursor: pointer; }
        .px-mute { font-size: 12.5px; color: var(--ad-muted); margin-top: 3px; }
        .px-item { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--ad-line); font-size: 13px; }
        .px-item:first-of-type { border-top: 0; }
        .px-main { min-width: 0; flex: 1; }
        .px-main a { color: var(--ad-ink); text-decoration: none; }
        .px-pre { white-space: pre-wrap; margin-top: 4px; }
        .px-acts { display: flex; flex-direction: column; gap: 6px; align-items: flex-end; }
        .px-b { height: 34px; padding: 0 12px; font-size: 12.5px; white-space: nowrap; }
        .px-sel { height: 34px; width: auto; padding: 0 10px; font-size: 12.5px; }
        .px-modal { max-width: 720px; max-height: calc(100vh - 40px); overflow-y: auto; padding: 22px; }
        .px-row { display: grid; grid-template-columns: 180px 1fr; gap: 10px; padding: 6px 0; border-bottom: 1px dashed var(--ad-line); font-size: 13px; }
        .px-row span { color: var(--ad-muted); }
        .px-row div { white-space: pre-wrap; color: var(--ad-ink); }
        .px-sec { margin-top: 14px; font-weight: 800; font-size: 13px; color: var(--ad-ink); }
        .px-mact { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
      `}</style>
    </div>
  );
}
