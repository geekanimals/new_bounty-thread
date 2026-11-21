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
  ["eligible", "Screened", "eligible"],
  ["sent_to_brand", "Sent to brand", "sent_to_brand"],
  ["brand_confirmed", "Approved", "accepted"],
  ["contract_sent", "Contract sent", "contract_sent"],
  ["contract_signed", "Contract signed", "contract_signed"],
  ["address_confirmed", "Address confirmed", "address_confirmed"],
  ["product_sent", "Courier sent", "product_sent"],
  ["content_created", "Video brief sent", "content_created"],
  ["content_submitted", "Video submitted", "content_submitted"],
  ["changes_requested", "Video submitted · changes asked", "changes_requested"],
  ["content_approved", "Client approved", "content_approved"],
  ["published", "Posted", "published"],
  ["completed", "Done", "completed"],
];

/** Is creator ke stage par kaun kaun se actions banta hai (purane bp-acts ki list) */
export function partActions(x, { ship: hasShip = true } = {}) {
  const st = x.stage;
  const ship = x.shipment || {};
  const posts = x.posts || [];
  const A = [];
  if (st === "applied") A.push(["bpscreen", "✓ Screened", 1], ["bpreject", "Not a fit"]);
  if (st === "eligible") A.push(["bpsend", "📋 Send to brand", 1]);
  if (st === "sent_to_brand") A.push(["bpbrand", "✅ Approve for brand", 1], ["bpbrandno", "Brand said no"]);
  if (["brand_confirmed", "accepted"].includes(st)) A.push(["bpcontract", "📜 Contract sent", 1]);
  if (st === "contract_sent") A.push(["bpcontract", "🔁 Resend contract (latest terms)"]);
  if (hasShip && ["address_confirmed", "accepted"].includes(st)) A.push(["bpship", "🚚 Courier sent", 1]);
  if (hasShip && ["product_sent", "content_created"].includes(st) && ship.status !== "delivered") A.push(["bpship", "✎ Edit courier"]);
  if (hasShip && st === "product_sent" && ship.status === "shipped") A.push(["bpdeliv", "📦 Courier delivered", 1]);
  if (x.blocked_at) A.push(["bpunblock", "✅ Called — unblock", 1], ["bpcall", "📝 Note a call"]);
  if (st === "content_submitted") A.push(["bpapprove", "✅ Client approved", 1], ["bpchanges", "✏️ Ask for changes"], ["bprelink", "🔗 Request a new link"]);
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

      {/* zaroori alerts sabse upar */}
      {(x.blocked_at || BP_FAIL.includes(x.stage)) && (
        <div className="pp-alerts">
          {x.blocked_at && (
            <div className="pp-bad">
              ⛔ <b>Blocked {fdt(x.blocked_at)}</b> — {x.block_reason || "no video 7 days after delivery"}. Call {x.phone ? <a href={`tel:${x.phone}`}><b>{x.phone}</b></a> : "— no number"}, ask why, note it and unblock with a new due date.
            </div>
          )}
          {BP_FAIL.includes(x.stage) && (
            <div className="pp-bad">
              Out of the campaign: <b>{String(x.stage).replace(/_/g, " ")}</b>
              {x.reason ? ` — ${x.reason}` : ""}
            </div>
          )}
        </div>
      )}

      <div className="pp-tiles">
        {/* 🎬 Content — video + reel / post links (sabse zaroori) */}
        <section className="pp-tile pp-tile--wide">
          <header>
            <span>🎬 Content</span>
            <em className={`pp-pill ${posts.length ? "is-ok" : rev?.decision === "approved" ? "is-ok" : sub ? "is-info" : overdue ? "is-bad" : ""}`}>
              {posts.length ? `${posts.length} posted` : rev?.decision === "approved" ? "Client approved" : sub ? "Video submitted" : overdue ? "Video overdue" : x.due_on ? "Waiting for video" : "Not started"}
            </em>
          </header>
          {posts.length > 0 && (
            <ul className="pp-posts">
              {posts.map((p, i) => (
                <li key={p.post_id || i}>
                  <span className="pp-posts__t">
                    📲 <b>{p.media_type ? String(p.media_type).replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase()) : "Post"}</b> · {fmtDate(p.posted_at)}
                    {p.stats && (p.stats.views || p.stats.reach) ? <span className="pp-views">👁 {Number(p.stats.views || p.stats.reach).toLocaleString("en-IN")} views</span> : null}
                  </span>
                  <span className="pp-posts__a">
                    {safe(p.permalink) && (
                      <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="pp-link">
                        Open reel ↗
                      </a>
                    )}
                    {safe(p.screenshot_url) && (
                      <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="pp-link">
                        📷 Screenshot
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <dl className="pp-kv">
            <div>
              <dt>Video</dt>
              <dd>
                {sub ? (
                  <>
                    {safe(sub.url) ? (
                      <a href={sub.url} target="_blank" rel="noopener noreferrer" className="pp-link">
                        Open the cut ↗
                      </a>
                    ) : (
                      "Submitted"
                    )}
                    <small>
                      {sub.rounds > 1 ? `round ${sub.rounds} · ` : ""}
                      {fdt(sub.submitted_at)}
                    </small>
                    {sub.note ? <small>“{sub.note}”</small> : null}
                  </>
                ) : (
                  <span className="pp-muted">Not submitted yet</span>
                )}
              </dd>
            </div>
            {x.due_on && !["published", "completed"].includes(x.stage) && (
              <div>
                <dt>Due</dt>
                <dd className={overdue ? "pp-red" : ""}>
                  {fmtDate(x.due_on)}
                  {overdue && <small className="pp-red">Overdue — blacklist + re-ship at their cost</small>}
                </dd>
              </div>
            )}
            {rev && (
              <div>
                <dt>Client</dt>
                <dd>
                  {rev.decision === "approved" ? "✅ Approved" : "✏️ Changes asked"}
                  <small>
                    {fdt(rev.at)}
                    {rev.reason ? ` — “${rev.reason}”` : ""}
                  </small>
                </dd>
              </div>
            )}
            {["content_created", "changes_requested"].includes(x.stage) && !x.blocked_at && (
              <div>
                <dt>Reminders</dt>
                <dd>
                  {x.reminders_sent || 0} sent
                  {x.next_reminder ? <small>next {fdt(x.next_reminder)}</small> : null}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* 🚚 Courier */}
        {hasShip && (
          <section className="pp-tile">
            <header>
              <span>🚚 Courier</span>
              <em className={`pp-pill ${ship.status === "delivered" ? "is-ok" : ship.status === "shipped" ? "is-info" : ship.status === "failed" ? "is-bad" : "is-warn"}`}>
                {{ pending: "Waiting for courier", shipped: "In transit", delivered: "Delivered", failed: "Delivery failed" }[ship.status] || (to ? "Not shipped yet" : "No address yet")}
              </em>
            </header>
            <dl className="pp-kv">
              {ship.courier && (
                <div>
                  <dt>Courier</dt>
                  <dd>{ship.courier}</dd>
                </div>
              )}
              {ship.tracking_ref && (
                <div>
                  <dt>Tracking</dt>
                  <dd>
                    <b>{ship.tracking_ref}</b>
                    {safe(ship.tracking_url) && (
                      <a href={ship.tracking_url} target="_blank" rel="noopener noreferrer" className="pp-link">
                        Track ↗
                      </a>
                    )}
                  </dd>
                </div>
              )}
              {(ship.shipped_at || ship.delivered_at) && (
                <div>
                  <dt>Dates</dt>
                  <dd>
                    {ship.shipped_at ? `Sent ${fmtDate(ship.shipped_at)}` : ""}
                    {ship.delivered_at ? <small>Delivered {fmtDate(ship.delivered_at)}</small> : null}
                  </dd>
                </div>
              )}
              {!ship.courier && !ship.tracking_ref && !ship.shipped_at && <div className="pp-muted">Nothing shipped yet.</div>}
            </dl>
          </section>
        )}

        {/* 📜 Contract */}
        <section className="pp-tile">
          <header>
            <span>📜 Contract</span>
            <em className={`pp-pill ${con.signed_at ? "is-ok" : con.issued_at ? "is-warn" : ""}`}>{con.signed_at ? `Signed ${fmtDate(con.signed_at)}` : con.issued_at ? "Not signed yet" : "Not sent"}</em>
          </header>
          {con.issued_at ? (
            <>
              <dl className="pp-kv">
                <div>
                  <dt>Deliver</dt>
                  <dd>
                    {dels || "—"}
                    <small>{con.content_days || 7} days to post · ad rights {con.ad_rights_months ?? 1} mo · collab {con.collab_rights ? "✓" : "✕"}</small>
                  </dd>
                </div>
                {con.signed_at && (
                  <div>
                    <dt>Signed by</dt>
                    <dd>{con.signature_name || "the creator"}</dd>
                  </div>
                )}
              </dl>
              {((con.clauses || []).some((c) => c.key === "non_delivery") || (con.clauses || []).some((c) => c.key === "reship")) && (
                <p className="pp-chips">
                  {(con.clauses || []).some((c) => c.key === "non_delivery") && <span>⛔ Blacklist clause</span>}
                  {(con.clauses || []).some((c) => c.key === "reship") && <span>↪ Re-ship clause</span>}
                </p>
              )}
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
            </>
          ) : (
            <p className="pp-muted">No contract sent yet.</p>
          )}
        </section>

        {/* 📍 Address */}
        {to && (
          <section className="pp-tile">
            <header>
              <span>📍 Ship to</span>
              <em className="pp-pill is-ok">{to.city || "Address"}</em>
            </header>
            <p className="pp-addr">
              <b>{to.name || ""}</b>
              <br />
              {[to.line1, to.line2, to.landmark].filter(Boolean).join(", ")}
              <br />
              {[to.city, to.state, to.postal_code].filter(Boolean).join(", ")}
              {to.phone ? (
                <>
                  <br />📞 {to.phone}
                </>
              ) : null}
            </p>
          </section>
        )}

        {/* 📞 / ⭐ notes */}
        {(x.call_note || x.feedback) && (
          <section className="pp-tile">
            <header>
              <span>📝 Notes</span>
            </header>
            {x.call_note && (
              <p className="pp-note">
                📞 Last call {fdt(x.call_at)}: “{x.call_note}”
              </p>
            )}
            {x.feedback && (
              <p className="pp-note">
                ⭐ Feedback: <b>{"★".repeat(+x.feedback.rating || 0)}</b>
                {x.feedback.comment ? ` — “${x.feedback.comment}”` : ""}
              </p>
            )}
          </section>
        )}
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
        .pp-alerts { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; font-size: 13px; line-height: 1.5; }
        .pp-tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
        .pp-tile { display: flex; flex-direction: column; gap: 10px; padding: 14px 15px; border-radius: 14px; border: 1px solid var(--ad-line); background: linear-gradient(180deg, #fff 0%, #fbfbff 100%); font-size: 13px; color: var(--ad-ink); min-width: 0; }
        .pp-tile--wide { grid-column: 1 / -1; }
        .pp-tile header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pp-tile header span { font-size: 13.5px; font-weight: 800; }
        .pp-pill { flex-shrink: 0; height: 22px; padding: 0 9px; border-radius: 999px; display: inline-flex; align-items: center; background: #eef0f6; color: #5d6683; font-style: normal; font-size: 11px; font-weight: 800; }
        .pp-pill.is-ok { background: #def7ec; color: #0b7a52; } .pp-pill.is-info { background: #e3eefe; color: #1f5fc9; } .pp-pill.is-warn { background: #fff1db; color: #a35a00; } .pp-pill.is-bad { background: #fde8e6; color: #b42318; }
        .pp-kv { display: grid; gap: 8px; margin: 0; }
        .pp-kv > div { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 8px; align-items: baseline; }
        .pp-kv dt { font-size: 11px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #9aa1bb; }
        .pp-kv dd { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; font-weight: 600; }
        .pp-kv dd small { flex-basis: 100%; font-size: 12px; font-weight: 500; color: var(--ad-muted); }
        .pp-link { color: var(--ad-primary) !important; font-weight: 800; text-decoration: none; }
        .pp-link:hover { text-decoration: underline; }
        .pp-posts { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
        .pp-posts li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 10px 12px; border-radius: 11px; background: #f2fbf6; border: 1px solid #cfeadc; }
        .pp-posts__t { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
        .pp-posts__a { display: inline-flex; gap: 12px; }
        .pp-views { font-size: 12px; font-weight: 700; color: #0b7a52; }
        .pp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
        .pp-chips span { height: 22px; padding: 0 9px; border-radius: 999px; display: inline-flex; align-items: center; background: #fff5f5; border: 1px solid #f5c8c8; color: #b42318; font-size: 11px; font-weight: 700; }
        .pp-addr { margin: 0; line-height: 1.55; color: #3b4462; }
        .pp-note { margin: 0; line-height: 1.5; }
        @media (max-width: 760px) { .pp-tiles { grid-template-columns: 1fr; } }
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
