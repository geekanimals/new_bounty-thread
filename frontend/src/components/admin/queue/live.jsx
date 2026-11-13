"use client";

/**
 * Overview, Action queue, Applications aur Logistics ka asli data (Supabase) — purane app ki hi calls:
 *  - api.approvals_inbox  → signups, campaigns (Approval), applicants, marketplace
 *  - api.process_inbox    → barter steps team par: review / ship / deliver / overdue / contract / unsigned / blocked
 *  - api.org_applicants + admin_applications → saari applications
 *  - api.shipments_board  → har parcel
 * Decisions bhi wahi RPC: set_member_status_v2, api.decide_campaign, api.org_decide_applicant,
 * decide_application, api.bp_review_video, api.bp_mark_delivered, api.bp_record_courier, api.bp_send_contract.
 */
import { useEffect, useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";

export const N = (v) => Number(v) || 0;
export const fmtNum = (v) => N(v).toLocaleString("en-IN");
export const short = (v) => {
  const n = N(v);
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 1 : 1).replace(/\.0$/, "") + "k";
  return String(n);
};
/** "2m ago" / "3 days" jaisa */
export const ago = (t) => {
  if (!t) return "—";
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  const d = Math.round(m / 1440);
  return d === 1 ? "1 day" : `${d} days`;
};
/** Applications table ke liye: Today / Yesterday / N days */
export const dayAgo = (t) => {
  if (!t) return "—";
  const a = new Date(t),
    n = new Date();
  const days = Math.floor((new Date(n.toDateString()) - new Date(a.toDateString())) / 86400000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days`;
};
export const fmtDate = (t) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—");

export const TYPE_LABEL = { paid: "Paid", barter: "Barter", barter_paid: "Barter + Paid" };
export const typeLabel = (t) => TYPE_LABEL[t] || (t ? String(t).replace(/_/g, " ") : "—");
/** campaign workspace ka id — purana app legacy id se kholta tha */
export const campId = (x) => x?.legacy_campaign_id || x?.campaign_id || x?.id || "";
export const who = (c = {}) => c.name || (c.username ? "@" + c.username : "Creator");

export const PENDING = ["applied", "eligible", "sent_to_brand"];
export const DECLINED = ["ineligible", "brand_declined", "dropped", "rejected"];
export const grp = (st) => (PENDING.includes(st) ? "pending" : DECLINED.includes(st) ? "declined" : "approved");
export const STAGE_LABEL = {
  applied: "Applied",
  eligible: "Screened ✓",
  sent_to_brand: "Awaiting brand",
  brand_confirmed: "Approved",
  ineligible: "Declined",
  brand_declined: "Declined",
  dropped: "Dropped",
  rejected: "Rejected",
};

/* ---------- Toast ---------- */
export function useToast() {
  const [toast, setToast] = useState(null); // {msg, bad}
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast ? (
    <div className="ga-toast" role="status">
      {toast.bad ? "⚠️" : "✓"} {toast.msg}
    </div>
  ) : null;
  return [node, (msg, bad = false) => setToast({ msg, bad })];
}

/* ---------- Approvals + barter steps (Action queue / Overview) ---------- */
export function useApprovals(refreshMs = 20000) {
  const a = useRpc("admin", "api.approvals_inbox", {}, { refreshMs });
  const p = useRpc("admin", "api.process_inbox", {}, { refreshMs });
  return {
    inbox: a.data || {},
    proc: Array.isArray(p.data) ? p.data : [],
    loading: a.loading,
    error: a.error,
    reload: () => {
      a.reload(true);
      p.reload(true);
    },
  };
}

/*
 * Figma ki tarah queue "groups" mein: ek campaign + ek kaam = ek row ("Screen new creators for Circle Diwali" 25).
 * f = filter tab, kind = signup | campaign | group
 */
const PROC = {
  review: { f: "content", icon: "▣", title: "Review submitted video drafts", reason: "Creator submissions need approval", pri: "Critical", tone: "red" },
  overdue: { f: "content", icon: "⏰", title: "Chase overdue videos", reason: "Video deadline has passed", pri: "Critical", tone: "red" },
  contract: { f: "contracts", icon: "✒️", title: "Send approved creator agreement", reason: "Approved, no contract sent yet", pri: "Medium", tone: "violet" },
  unsigned: { f: "contracts", icon: "✍️", title: "Chase unsigned contracts", reason: "Contract unsigned for 3+ days", pri: "Medium", tone: "violet" },
  ship: { f: "logistics", icon: "▣", title: "Dispatch product kits", reason: "Address confirmed — add courier and tracking", pri: "High", tone: "orange" },
  deliver: { f: "logistics", icon: "🚚", title: "Confirm deliveries in transit", reason: "Parcels on the way — mark delivered", pri: "High", tone: "orange" },
  blocked: { f: "logistics", icon: "⛔", title: "Call blocked creators", reason: "Blocked — call the creator", pri: "Critical", tone: "red" },
};
const slug = (s) =>
  String(s || "x")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "x";
const oldest = (list, k) => list.reduce((m, x) => (!m || (x[k] && x[k] < m) ? x[k] : m), null);
const ROLE = { owner: "Agency", brand: "Brand", manager: "Manager", corporate: "Corporate" };

export function buildQueue(inbox = {}, proc = []) {
  const out = [];
  // 1) creators to decide — per campaign
  const apps = [...(inbox.applicants || []), ...(inbox.marketplace || []).map((m) => ({ ...m, _legacy: true, applied_at: m.created_at }))];
  const byCamp = {};
  apps.forEach((x) => {
    const k = x.campaign_name || "Campaign";
    (byCamp[k] = byCamp[k] || []).push(x);
  });
  Object.entries(byCamp).forEach(([name, list]) => {
    const first = list[0] || {};
    const since = oldest(list, "applied_at");
    out.push({
      id: `apps-${slug(name)}`,
      f: "applications",
      kind: "group",
      icon: "✍️",
      title: `Screen new creators for ${name}`,
      campaign: [name, typeLabel(first.campaign_type) !== "—" ? typeLabel(first.campaign_type) : ""].filter(Boolean).join(" · "),
      reason: `${list.length} applicant${list.length > 1 ? "s" : ""} waiting for a decision`,
      pri: "High",
      tone: "orange",
      since,
      cid: campId(first),
      items: list,
    });
  });
  // 2) barter steps — per kind + campaign
  const byKind = {};
  proc.forEach((x) => {
    const k = `${x.kind}|${x.campaign_name || ""}`;
    (byKind[k] = byKind[k] || []).push(x);
  });
  Object.entries(byKind).forEach(([k, list]) => {
    const [kind, name] = k.split("|");
    const P = PROC[kind] || { f: "content", icon: "•", title: kind, reason: "", pri: "Medium", tone: "violet" };
    out.push({
      id: `${kind}-${slug(name)}`,
      f: P.f,
      kind: "group",
      proc: kind,
      icon: P.icon,
      title: P.title,
      campaign: name || "Campaign",
      reason: P.reason,
      pri: P.pri,
      tone: P.tone,
      since: oldest(list, "since"),
      cid: campId(list[0]),
      items: list,
    });
  });
  // 3) campaigns waiting to go live — har ek apni row
  (inbox.campaigns || []).forEach((c) =>
    out.push({
      id: `camp-${c.id}`,
      f: "campaigns",
      kind: "campaign",
      icon: "📣",
      title: `Approve campaign: ${c.name}`,
      campaign: [c.brand, typeLabel(c.campaign_type)].filter((v) => v && v !== "—").join(" · "),
      line: [c.brand || c.org_name, typeLabel(c.campaign_type), c.budget ? `₹${fmtNum(c.budget)}` : "", c.start_date ? `starts ${fmtDate(c.start_date)}` : "", c.org_name ? `submitted by ${c.org_name}` : ""]
        .filter((v) => v && v !== "—")
        .join(" · "),
      reason: "A new campaign brief is waiting for approval",
      pri: "High",
      tone: "orange",
      since: c.created_at,
      cid: c.id,
      rec: c,
      items: [c],
    })
  );
  // 4) agency / brand signups (sirf Super Admin)
  (inbox.signups || []).forEach((m) =>
    out.push({
      id: `signup-${m.id}`,
      f: "signups",
      kind: "signup",
      icon: m.role === "brand" ? "🏷️" : "🏢",
      title: `${m.name || m.org_name || m.email || "Someone"} wants ${m.role === "brand" ? "a brand" : "an agency"} account`,
      campaign: `${ROLE[m.role] || "Account"} signup`,
      line: [ROLE[m.role] || m.role, `signed up ${ago(m.created_at)}`, m.email ? `${m.email}${m.email_verified ? " ✓" : ""}` : "", m.whatsapp].filter(Boolean).join(" · "),
      reason: "A new account is waiting for workspace access",
      pri: "Medium",
      tone: "violet",
      since: m.created_at,
      rec: m,
      items: [m],
    })
  );
  const rank = { Critical: 0, High: 1, Medium: 2 };
  return out.map((q) => ({ ...q, count: q.items.length, when: whenOf(q) })).sort((a, b) => rank[a.pri] - rank[b.pri] || String(a.since || "").localeCompare(String(b.since || "")));
}
function whenOf(q) {
  if (q.proc === "overdue") return "Overdue";
  if (!q.since) return "Today";
  const d = Math.floor((Date.now() - new Date(q.since).getTime()) / 86400000);
  return d <= 0 ? "Today" : d === 1 ? "1 day" : `${d} days`;
}

/* ---------- Decline reason popup (purane openReasonModal jaisa) ---------- */
let _reasons = null;
async function rejectionReasons() {
  if (_reasons) return _reasons;
  const { data } = await rpc("admin", "api.rejection_reasons");
  _reasons = Array.isArray(data) && data.length ? data : [{ code: "other", label: "Other" }];
  return _reasons;
}
const BRIEF = /^(low_followers|high_followers|low_engagement|location_mismatch|gender_mismatch|age_mismatch|category_mismatch|language_mismatch|pet_mismatch|marital_mismatch|barter_not_open)$/;

/**
 * const [modal, ask] = useReason();  const pick = await ask("Why…?")  → {code, note} | null
 * mode "text" = sirf ek reason likhna (signup decline / campaign send back)
 */
export function useReason() {
  const [st, setSt] = useState(null);
  const ask = (title, opt = {}) =>
    new Promise(async (resolve) => {
      const reasons = opt.mode === "text" ? [] : await rejectionReasons();
      setSt({ title, opt, reasons, resolve, code: "", note: "", err: "" });
    });
  const done = (v) => {
    st?.resolve(v);
    setSt(null);
  };
  const node = st ? (
    <div className="ga-overlay" onClick={() => done(null)}>
      <form
        className="ga-modal rq"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (st.opt.mode !== "text" && !st.code) return setSt({ ...st, err: "Pick a reason." });
          const msg = st.note.trim();
          if (st.opt.mode === "text" ? !msg && st.opt.required !== false : msg.length < 5)
            return setSt({ ...st, err: st.opt.mode === "text" ? "Write a reason." : "Write the message the creator will get." });
          done({ code: st.code || null, note: msg });
        }}
      >
        <div className="rq-head">
          <h3>{st.title}</h3>
          <button type="button" className="rq-x" onClick={() => done(null)} aria-label="Close">
            ✕
          </button>
        </div>
        {st.opt.mode !== "text" && (
          <>
            <p className="ga-label">Reason</p>
            {[
              ["Doesn't match the brief", st.reasons.filter((r) => BRIEF.test(r.code))],
              ["Other reasons", st.reasons.filter((r) => !BRIEF.test(r.code))],
            ]
              .filter(([, l]) => l.length)
              .map(([g, l]) => (
                <div key={g} className="rq-grp">
                  <small>{g}</small>
                  <div className="rq-chips">
                    {l.map((r) => (
                      <button
                        key={r.code}
                        type="button"
                        className={`ga-tab ${st.code === r.code ? "is-on" : ""}`}
                        onClick={() => setSt({ ...st, code: r.code, err: "", note: !st.note.trim() || st.note === st.auto ? (r.code === "other" ? "" : `${r.label}.`) : st.note, auto: r.code === "other" ? "" : `${r.label}.` })}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </>
        )}
        <label className="ga-label" htmlFor="rq-note">
          {st.opt.label || "Message to the creator — why they weren't selected"}
        </label>
        <textarea id="rq-note" className="ga-input" rows={3} maxLength={400} value={st.note} placeholder={st.opt.placeholder || "e.g. The brand needs creators based in Jaipur for this campaign."} onChange={(e) => setSt({ ...st, note: e.target.value, err: "" })} />
        {st.opt.hint !== false && <p className="ga-hint">{st.opt.hint || "📨 Sent on WhatsApp, by email and in the app."}</p>}
        {st.err && <p className="rq-err">{st.err}</p>}
        <button type="submit" className="ga-btn ga-btn--primary rq-go">
          {st.opt.cta || "Decline & send message"}
        </button>
        <style>{`
          .rq { padding: 22px; }
          .rq-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
          .rq-head h3 { font-family: var(--ad-head); font-size: 19px; font-weight: 800; letter-spacing: -0.5px; }
          .rq-x { width: 34px; height: 34px; flex-shrink: 0; border: 0; border-radius: 10px; background: var(--ad-soft); color: #65718c; }
          .rq-grp { margin-bottom: 12px; }
          .rq-grp small { display: block; margin-bottom: 6px; font-size: 11px; color: var(--ad-muted); }
          .rq-chips { display: flex; flex-wrap: wrap; gap: 6px; }
          .rq-chips .ga-tab { height: 32px; font-size: 12.5px; }
          .rq textarea { margin-top: 2px; }
          .rq-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
          .rq-go { width: 100%; margin-top: 14px; }
        `}</style>
      </form>
    </div>
  ) : null;
  return [node, ask];
}

/* ---------- Decisions (purane app jaise args) ---------- */
export const act = {
  approveSignup: (id) => rpc("admin", "set_member_status_v2", { p_id: id, p_status: "active", p_reason: null }),
  declineSignup: (id, reason) => rpc("admin", "set_member_status_v2", { p_id: id, p_status: "declined", p_reason: reason }),
  approveCampaign: (id) => rpc("admin", "api.decide_campaign", { p_campaign: id, p_approve: true, p_reason: null }),
  sendBackCampaign: (id, reason) => rpc("admin", "api.decide_campaign", { p_campaign: id, p_approve: false, p_reason: reason || null }),
  approveApplicant: (pid) => rpc("admin", "api.org_decide_applicant", { p_participation: pid, p_approve: true, p_reason_code: null, p_note: null }),
  declineApplicant: (pid, pick) => rpc("admin", "api.org_decide_applicant", { p_participation: pid, p_approve: false, p_reason_code: pick.code, p_note: pick.note || null }),
  approveLegacy: (id) => rpc("admin", "decide_application", { p_id: id, p_approve: true, p_reason_code: null, p_note: null }),
  declineLegacy: (id, pick) => rpc("admin", "decide_application", { p_id: id, p_approve: false, p_reason_code: pick.code, p_note: pick.note || null }),
  approveVideo: (pid) => rpc("admin", "api.bp_review_video", { p_participation: pid, p_approve: true, p_reason: null }),
  changesVideo: (pid, reason) => rpc("admin", "api.bp_review_video", { p_participation: pid, p_approve: false, p_reason: reason }),
  markDelivered: (pid) => rpc("admin", "api.bp_mark_delivered", { p_participation: pid }),
  sendContract: (pid) => rpc("admin", "api.bp_send_contract", { p_participation: pid }),
  recordCourier: (pid, payload) => rpc("admin", "api.bp_record_courier", { p_participation: pid, p_payload: payload }),
};
export { errText };

/** chhota "Loading / error / retry" box (Figma card ke andar) */
export function StateBox({ loading, error, onRetry, empty }) {
  if (loading)
    return (
      <div className="lv-box" aria-busy="true">
        <span className="lv-sk" />
        <span className="lv-sk" />
        <span className="lv-sk" />
        <style>{CSS}</style>
      </div>
    );
  if (error)
    return (
      <div className="lv-box lv-box--err">
        <span>⚠️ {errText(error)}</span>
        {onRetry && (
          <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" onClick={() => onRetry()}>
            Retry
          </button>
        )}
        <style>{CSS}</style>
      </div>
    );
  if (empty)
    return (
      <div className="lv-box lv-box--empty">
        {empty}
        <style>{CSS}</style>
      </div>
    );
  return null;
}
const CSS = `
  .lv-box { display: flex; flex-direction: column; gap: 10px; padding: 14px 0; }
  .lv-sk { display: block; height: 58px; border-radius: 14px; background: linear-gradient(90deg, var(--ad-soft) 0%, #f7f8fc 50%, var(--ad-soft) 100%); background-size: 200% 100%; animation: lvSk 1.2s linear infinite; }
  @keyframes lvSk { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .lv-box--err { flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 14px 16px; border-radius: 14px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 13px; font-weight: 700; }
  .lv-box--empty { align-items: center; padding: 30px 16px; border-radius: 14px; border: 1px dashed var(--ad-line-2); font-size: 13px; color: var(--ad-muted); text-align: center; }
`;
