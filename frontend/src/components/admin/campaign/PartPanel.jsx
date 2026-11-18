"use client";

import { fmtDate, BP_FAIL } from "@/components/admin/campaign/live";

/*
 * Joined creator (participation) ka poora campaign file + har step ke action buttons —
 * purane app ke creator card (bp-facts + bp-acts) jaisa. Actions journey.jsx ke runAction se chalte hain.
 */
const fdt = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};
const safe = (u) => (/^https?:\/\//i.test(String(u || "")) ? u : null);

const STEPS = [
  ["applied", "Applied", "applied"],
  ["eligible", "Meets the brief", "eligible"],
  ["sent_to_brand", "On the brand's list", "sent_to_brand"],
  ["brand_confirmed", "Brand confirmed", "accepted"],
  ["contract_sent", "Contract sent", "contract_sent"],
  ["contract_signed", "Contract signed", "contract_signed"],
  ["address_confirmed", "Address confirmed", "address_confirmed"],
  ["product_sent", "Courier sent", "product_sent"],
  ["content_created", "Delivered — making the video", "content_created"],
  ["content_submitted", "Video submitted", "content_submitted"],
  ["changes_requested", "Changes asked", "changes_requested"],
  ["content_approved", "Video approved", "content_approved"],
  ["published", "Posted", "published"],
  ["completed", "Done", "completed"],
];

/** Is creator ke stage par kaun kaun se actions banta hai (purane bp-acts ki list) */
export function partActions(x, { ship: hasShip = true } = {}) {
  const st = x.stage;
  const ship = x.shipment || {};
  const posts = x.posts || [];
  const A = [];
  if (st === "applied") A.push(["bpscreen", "✓ Meets the brief", 1], ["bpreject", "Not a fit"]);
  if (st === "eligible") A.push(["bpsend", "📋 Add to the brand's list", 1]);
  if (st === "sent_to_brand") A.push(["bpbrand", "✅ Brand confirmed", 1], ["bpbrandno", "Brand passed"]);
  if (["brand_confirmed", "accepted"].includes(st)) A.push(["bpcontract", "📜 Send contract now", 1]);
  if (st === "contract_sent") A.push(["bpcontract", "🔁 Resend contract (latest terms)"]);
  if (hasShip && ["address_confirmed", "accepted"].includes(st)) A.push(["bpship", "🚚 Add courier & tracking", 1]);
  if (hasShip && ["product_sent", "content_created"].includes(st) && ship.status !== "delivered") A.push(["bpship", "✎ Edit courier"]);
  if (hasShip && st === "product_sent" && ship.status === "shipped") A.push(["bpdeliv", "📦 Mark delivered → send video brief", 1]);
  if (x.blocked_at) A.push(["bpunblock", "✅ Called — unblock", 1], ["bpcall", "📝 Note a call"]);
  if (st === "content_submitted") A.push(["bpapprove", "✅ Approve video", 1], ["bpchanges", "✏️ Ask for changes"], ["bprelink", "🔗 Request a new link"]);
  if (["content_created", "content_submitted", "changes_requested", "content_approved", "published", "completed"].includes(st)) A.push(["bppost", "🔗 Add post / story", st === "content_approved" ? 1 : 0]);
  if (["published", "completed"].includes(st) && posts.length) A.push(["bpmetrics", "📈 Add numbers"]);
  if (st === "published") A.push(["bpdone", "🏁 Mark complete", 1]);
  if (!["dropped", "rejected", "completed", "published", "ineligible", "brand_declined"].includes(st)) A.push(["bpreassign", "↪ Send product to someone else"]);
  if (!x.blacklisted && st !== "completed") A.push(["bpblack", "⛔ Blocklist", 0, "danger"]);
  return A;
}

export default function PartPanel({ row, busy, onAct, ship: hasShip = true }) {
  const x = row.x || {};
  const con = x.contract || {};
  const ship = x.shipment || {};
  const to = x.ship_to;
  const sub = x.submission;
  const rev = x.review;
  const posts = x.posts || [];
  const steps = x.steps || {};
  const today = new Date().toISOString().slice(0, 10);
  const overdue = x.due_on && x.due_on < today && ["content_created", "changes_requested"].includes(x.stage);
  const acts = partActions(x, { ship: hasShip });
  const curIdx = STEPS.findIndex((s) => s[0] === x.stage || s[2] === x.stage);
  const dels = (con.deliverables || []).map((d) => `${d.quantity || 1}× ${d.format || "content"}`).join(" + ");

  return (
    <div className="pp">
      <h3 className="ga-h2">Step actions</h3>
      <p className="pp-sub">Everything you can do for this creator on their current step.</p>
      <div className="pp-acts">
        {acts.map(([k, l, pri, tone]) => (
          <button key={k + l} type="button" className={`pp-btn ${pri ? "is-pri" : ""} ${tone === "danger" ? "is-bad" : ""}`} disabled={!!busy} onClick={() => onAct(k)}>
            {busy === k ? "…" : l}
          </button>
        ))}
        {x.blocked_at && x.phone && (
          <a className="pp-btn" href={`tel:${x.phone}`}>
            📞 Call
          </a>
        )}
      </div>

      <h3 className="ga-h2 pp-h">Campaign file</h3>
      <div className="pp-facts">
        {con.issued_at && (
          <div>
            📜 Contract {con.signed_at ? <><b>signed</b> by {con.signature_name || "the creator"} on {fmtDate(con.signed_at)}</> : <>sent {fmtDate(con.issued_at)} — <b>not signed yet</b></>}
            {" · "}
            {con.product || "product"} · {dels || "—"} · {con.content_days || 7} days to post · ad rights {con.ad_rights_months ?? 1} mo · collab {con.collab_rights ? "✓" : "✕"}
            {(con.clauses || []).some((c) => c.key === "non_delivery") ? " · ⛔ blacklist clause" : ""}
            {(con.clauses || []).some((c) => c.key === "reship") ? " · ↪ re-ship clause" : ""}
            {(con.clauses || []).length > 0 && (
              <details className="pp-cl">
                <summary>Read the contract</summary>
                <ol>
                  {con.clauses.map((c, i) => (
                    <li key={i}>{c.text || c.title || c.label || c.key}</li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        )}
        {to && (
          <div>
            📍 Ship to: <b>{to.name || ""}</b>, {[to.line1, to.line2, to.landmark, to.city, to.state, to.postal_code].filter(Boolean).join(", ")}
            {to.phone ? ` · 📞 ${to.phone}` : ""}
          </div>
        )}
        {ship.status && (
          <div>
            🚚 {{ pending: "Waiting for courier", shipped: "In transit", delivered: "Delivered", failed: "Delivery failed" }[ship.status] || ship.status}
            {ship.courier ? ` · ${ship.courier}` : ""}
            {ship.tracking_ref ? <> · <b>{ship.tracking_ref}</b></> : ""}
            {safe(ship.tracking_url) && (
              <>
                {" · "}
                <a href={ship.tracking_url} target="_blank" rel="noopener noreferrer">
                  track ↗
                </a>
              </>
            )}
            {ship.delivered_at ? ` · delivered ${fmtDate(ship.delivered_at)}` : ship.shipped_at ? ` · sent ${fmtDate(ship.shipped_at)}` : ""}
          </div>
        )}
        {x.blocked_at && (
          <div className="pp-bad">
            ⛔ <b>Blocked {fdt(x.blocked_at)}</b> — {x.block_reason || "no video 7 days after delivery"}. Call {x.phone ? <a href={`tel:${x.phone}`}><b>{x.phone}</b></a> : "— no number"}, ask why, note it and unblock with a new due date.
          </div>
        )}
        {x.call_note && (
          <div>
            📞 Last call {fdt(x.call_at)}: “{x.call_note}”
          </div>
        )}
        {["content_created", "changes_requested"].includes(x.stage) && !x.blocked_at && (
          <div>
            🔔 Reminders sent: <b>{x.reminders_sent || 0}</b>
            {x.next_reminder ? ` · next ${fdt(x.next_reminder)}` : ""}
          </div>
        )}
        {x.feedback && (
          <div>
            ⭐ Creator feedback: <b>{"★".repeat(+x.feedback.rating || 0)}</b>
            {x.feedback.comment ? ` — “${x.feedback.comment}”` : ""}
          </div>
        )}
        {x.due_on && !["published", "completed"].includes(x.stage) && (
          <div>
            ⏳ Video due <b>{fmtDate(x.due_on)}</b>
            {overdue && <b className="pp-red"> — overdue (contract: blacklist + re-ship at their cost)</b>}
          </div>
        )}
        {sub && (
          <div>
            🎬 Video{sub.rounds > 1 ? ` (round ${sub.rounds})` : ""}:{" "}
            {safe(sub.url) ? (
              <a href={sub.url} target="_blank" rel="noopener noreferrer">
                open the cut ↗
              </a>
            ) : (
              "—"
            )}{" "}
            · {fdt(sub.submitted_at)}
            {sub.note ? ` · “${sub.note}”` : ""}
          </div>
        )}
        {rev && (
          <div>
            {rev.decision === "approved" ? "✅ Approved" : "✏️ Changes asked"} {fdt(rev.at)}
            {rev.reason ? ` — “${rev.reason}”` : ""}
          </div>
        )}
        {posts.map((p, i) => (
          <div key={p.post_id || i}>
            📲 {p.media_type || "post"} posted {fmtDate(p.posted_at)}
            {safe(p.permalink) && (
              <>
                {" · "}
                <a href={p.permalink} target="_blank" rel="noopener noreferrer">
                  open ↗
                </a>
              </>
            )}
            {safe(p.screenshot_url) && (
              <>
                {" · "}
                <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer">
                  📷 screenshot
                </a>
              </>
            )}
            {p.stats && (p.stats.views || p.stats.reach) ? ` · ${p.stats.views || p.stats.reach} views` : ""}
          </div>
        ))}
        {BP_FAIL.includes(x.stage) && (
          <div className="pp-bad">
            Out of the campaign: <b>{String(x.stage).replace(/_/g, " ")}</b>
            {x.reason ? ` — ${x.reason}` : ""}
          </div>
        )}
        {!con.issued_at && !to && !ship.status && !sub && !posts.length && !x.blocked_at && <div className="pp-muted">Nothing on file yet for this creator.</div>}
      </div>

      <details className="pp-tl">
        <summary>Step timeline</summary>
        <ol>
          {STEPS.map((s, i) => {
            const at = steps[s[0]] || steps[s[2]] || (s[0] === "contract_sent" ? con.issued_at : null) || (s[0] === "contract_signed" ? con.signed_at : null);
            if (s[0] === "changes_requested" && !at) return null;
            const reached = !!at || (!BP_FAIL.includes(x.stage) && curIdx >= 0 && i <= curIdx);
            const here = i === curIdx && x.stage !== "completed";
            return (
              <li key={s[0]} className={`${reached ? "on" : ""} ${here ? "here" : ""}`}>
                <span>
                  {s[1]}
                  {here && <em> ← now</em>}
                </span>
                <small>{at ? fdt(at) : reached ? "✓" : "—"}</small>
              </li>
            );
          })}
        </ol>
      </details>

      <style>{`
        .pp-sub { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
        .pp-acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .pp-btn { display: inline-flex; align-items: center; min-height: 38px; padding: 0 13px; border-radius: 10px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 13px; font-weight: 800; color: #6657e9; text-decoration: none; cursor: pointer; }
        .pp-btn:hover { border-color: var(--ad-primary); background: var(--ad-soft-2); }
        .pp-btn.is-pri { background: var(--ad-primary); border-color: var(--ad-primary); color: #fff; }
        .pp-btn.is-bad { color: #dc2626; border-color: rgba(220,38,38,.45); }
        .pp-btn:disabled { opacity: .6; cursor: default; }
        .pp-h { margin-top: 22px; }
        .pp-facts { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; font-size: 13px; line-height: 1.5; color: var(--ad-ink); }
        .pp-facts a { color: var(--ad-primary); font-weight: 700; }
        .pp-bad { padding: 9px 11px; border-radius: 10px; background: #ffeef0; color: #b64455; }
        .pp-red { color: #dc2626; }
        .pp-muted { color: var(--ad-muted); }
        .pp-cl summary, .pp-tl summary { cursor: pointer; font-weight: 800; color: var(--ad-primary); }
        .pp-cl ol { margin: 8px 0 0 18px; font-size: 12.5px; color: var(--ad-muted); }
        .pp-tl { margin-top: 16px; font-size: 13px; }
        .pp-tl ol { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
        .pp-tl li { display: flex; justify-content: space-between; gap: 10px; padding: 7px 10px; border-radius: 9px; background: var(--ad-soft-2); color: var(--ad-muted); }
        .pp-tl li.on { color: var(--ad-ink); }
        .pp-tl li.here { outline: 2px solid var(--ad-primary); }
        .pp-tl em { font-style: normal; font-weight: 800; color: var(--ad-primary); }
      `}</style>
    </div>
  );
}
