"use client";

import { useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, currentPath } from "@/components/creater/TrackerSteps";
import PayBox from "@/components/creater/PayBox";
import { noteOf, fdate, DECLINED, codeFill, safeLink, compLine, respondToInvite } from "@/services/creator";

/** brief ki ek line (khaali ho to kuch nahi) */
function Line({ label, v }) {
  if (!v) return null;
  return (
    <>
      <p className="ov-k">{label}</p>
      <p className="ov-v">{v}</p>
    </>
  );
}

/**
 * /creater/my-campaigns/[id] — campaign overview (id = participation_id): abhi kis step par ho + agla step.
 * Purane nextStepHtml jaisa: invite (accept / pass), application review, selected, blocked, not selected —
 * baaki steps ke liye "Continue" button us step ke page par. Neeche video brief + campaign details.
 */
export default function CampaignOverview() {
  const t = useTracker();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [passing, setPassing] = useState(false);
  const [reason, setReason] = useState("");

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );

  const { m, c, step } = t;
  const P = m.participation_id;
  const label = (t.steps.find((x) => x.key === step) || {}).label;
  const declined = DECLINED.includes(m.stage);
  const b = m.video_brief || null;
  const tags = [].concat(m.hashtags || [], (m.mentions || []).map((x) => (String(x).charAt(0) === "@" ? x : "@" + x)));

  // invite: accept / pass (purane respond_to_campaign)
  const respond = async (accept) => {
    if (!accept && !reason.trim()) return setErr("Tell the brand why you're passing — they see this.");
    setBusy(true);
    setErr("");
    const r = await respondToInvite(P, accept, reason.trim());
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    setPassing(false);
    t.reload();
  };

  const card = () => {
    if (m.blocked_at)
      return (
        <>
          <span className="ts-ic ts-ic--red">⛔</span>
          <h2>Your account is blocked</h2>
          <p>
            You received the product but no video came in within 7 days, so campaigns are paused for you. Our team will call you — or submit your video now and reply on
            WhatsApp.
          </p>
          <Link href={`${t.base}/draft`} className="bx-btn bx-btn--dark bx-btn--lg">
            🎬 Submit my video →
          </Link>
        </>
      );
    if (declined)
      return (
        <>
          <span className="ts-ic ts-ic--red">✗</span>
          <h2>Not selected this time</h2>
          <p>
            {m.reason_label ? (
              <>
                Reason: <b>{m.reason_label}</b>.{" "}
              </>
            ) : null}
            {m.reason && m.reason !== m.reason_label ? `“${String(m.reason).replace(/^.*?—\s*/, "")}” ` : ""}
            It doesn’t affect your other applications.
          </p>
          <Link href="/creater/discover" className="bx-btn bx-btn--dark">
            Find campaigns that fit you →
          </Link>
        </>
      );
    if (m.stage === "invited")
      return (
        <>
          <span className="ts-ic ts-ic--gold">🎯</span>
          <h2>{m.needs_approval ? `${m.brand || "A brand"} wants you on this campaign` : "You’re invited"}</h2>
          <p>
            {m.needs_approval
              ? "Read the campaign details below and tap Apply — the brand confirms and your contract follows automatically."
              : "Read the campaign details below, then accept or pass."}
          </p>
          {passing ? (
            <>
              <label className="bx-label" htmlFor="ov-reason">
                Tell the brand why you’re passing (they see this)
              </label>
              <textarea id="ov-reason" className="bx-input" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="ov-btns">
                <button type="button" className="bx-btn bx-btn--dark" disabled={busy} onClick={() => respond(false)}>
                  {busy ? "Sending…" : "Send & pass"}
                </button>
                <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setPassing(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="ov-btns">
              <button type="button" className="bx-btn bx-btn--dark bx-btn--lg" disabled={busy} onClick={() => respond(true)}>
                {busy ? "…" : m.needs_approval ? "✅ Apply" : "✅ Accept invite"}
              </button>
              <button type="button" className="bx-btn bx-btn--ghost" onClick={() => setPassing(true)}>
                {m.needs_approval ? "Not for me" : "Pass"}
              </button>
            </div>
          )}
          {err && <p className="ts-err">{err}</p>}
        </>
      );
    if (["applied", "eligible", "shortlisted"].includes(m.stage))
      return (
        <>
          <span className="ts-ic">⏳</span>
          <h2>Application received</h2>
          <p>Geek is checking your profile against the brand’s brief. You’ll get a WhatsApp the moment there’s news.</p>
        </>
      );
    if (m.stage === "sent_to_brand")
      return (
        <>
          <span className="ts-ic">📋</span>
          <h2>With the brand</h2>
          <p>You’re on the final list the brand is reviewing.</p>
        </>
      );
    if (step === "selected")
      return (
        <>
          <span className="ts-ic ts-ic--gold">🎉</span>
          <h2>You’re selected!</h2>
          <p>Your contract is being prepared — it will appear here in a moment.</p>
        </>
      );
    return (
      <>
        <span className="ts-ic">{m.stage === "completed" ? "🏁" : m.stage === "changes_requested" ? "🔁" : "👉"}</span>
        <h2>{m.stage === "completed" ? "Campaign complete 🎉" : `You’re at: ${m.stage === "changes_requested" ? "Draft — change requested" : label}`}</h2>
        <p>{noteOf(m)}</p>
        <Link href={currentPath(m)} className="bx-btn bx-btn--dark bx-btn--lg">
          {m.stage === "completed" ? "See details →" : `Continue: ${m.stage === "changes_requested" ? "Fix your draft" : label} →`}
        </Link>
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`${c.title} — My campaigns — Bounty`}</title>
      <TrackerFrame t={t} overview>
        {card()}

        {!declined && <PayBox t={t} />}

        {b && (
          <details className="ov-fold" open={["content_created", "changes_requested"].includes(m.stage)}>
            <summary>
              🎬 Your video brief {m.deadline && ["content_created", "changes_requested"].includes(m.stage) ? <em>Due {fdate(m.deadline)}</em> : null}
            </summary>
            {m._trk && m._trk.say_code && (
              <p className="ov-code">
                🎟️ Say this code in your video: {m._trk.code ? <b>{m._trk.code}</b> : <i>being set up — it shows here before you shoot</i>}
              </p>
            )}
            <Line label="What to shoot" v={codeFill(m, b.what_to_shoot)} />
            <Line label="Key messages" v={codeFill(m, b.key_messages)} />
            <Line label="Do's" v={codeFill(m, b.dos)} />
            <Line label="Don'ts" v={codeFill(m, b.donts)} />
            <Line label="Make" v={b.deliverables_text} />
            <Line label="Caption" v={codeFill(m, b.caption)} />
            <Line label="Hashtags & tags" v={[b.hashtags, b.mentions].filter(Boolean).join(" ")} />
            <Line label="References" v={b.reference_links} />
            <Line label="Posting note" v={b.posting_note} />
            <p className="ov-small">Always disclose the collaboration (Paid partnership label / #ad) as per ASCI.</p>
          </details>
        )}

        <details className="ov-fold" id="brief" open={m.stage === "invited"}>
          <summary>📄 Campaign details &amp; brief</summary>
          <Line label="Brand" v={[m.brand, m.org_name].filter(Boolean).join(" · ")} />
          <Line label="Reward" v={compLine(m)} />
          <Line label="Product" v={m.product} />
          <Line label="Campaign dates" v={m.starts_on || m.ends_on ? `${fdate(m.starts_on)} – ${fdate(m.ends_on)}` : ""} />
          <Line label="Applied with" v={m.applied_profile ? "@" + m.applied_profile : ""} />
          <Line label="Applied on" v={m.applied_at ? fdate(m.applied_at) : ""} />
          <Line label="Cities" v={(m.cities || []).join(", ")} />
          <Line label="Platforms" v={m.platforms} />
          <Line label="Brief" v={m.brief} />
          <Line label="What to make" v={m.deliverables_text} />
          <Line label="Must include in your caption" v={tags.join(" ")} />
          {m.product_link && (
            <p className="ov-v">
              <a href={safeLink(m.product_link)} target="_blank" rel="noopener noreferrer">
                View product ↗
              </a>
            </p>
          )}
          {(m.attachments || []).map((a, i) => (
            <p key={i} className="ov-v">
              <a href={safeLink(a.url)} target="_blank" rel="noopener noreferrer">
                📎 {a.name || "file"}
              </a>
            </p>
          ))}
        </details>
      </TrackerFrame>
      <style>{`
        .ov-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
        .ov-fold { margin-top: 16px; padding: 2px 14px 12px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); }
        .ov-fold summary { padding: 11px 0; cursor: pointer; font-family: var(--bx-serif); font-size: 16px; font-weight: 600; color: #14231a; list-style: none; }
        .ov-fold summary::-webkit-details-marker { display: none; }
        .ov-fold summary em { margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: #fbe7b5; font-style: normal; font-family: var(--bx-sans); font-size: 11px; font-weight: 700; color: #8a5d14; }
        .ov-k { margin: 10px 0 2px; font-size: 11.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8a6b32; }
        .ov-v { margin: 0; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; color: #14231a; }
        .ov-v a { font-weight: 700; color: #2e9c94; }
        .ov-code { margin: 4px 0 6px; padding: 8px 10px; border-radius: 10px; background: #fbe7b5; font-size: 13px; }
        .ov-small { margin: 10px 0 0; font-size: 12px; color: var(--bx-muted); }
      `}</style>
    </BountyShell>
  );
}
