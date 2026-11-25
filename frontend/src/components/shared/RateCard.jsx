"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";

/*
 * ⭐ Rate card — ek campaign par creator ki rating (1–5 stars + comment).
 *  door="admin": Geek team rate kare + brand ki rating dekhe + creator ki poori history (har campaign, comments, average)
 *  door="brand": brand apni rating de + Geek team ki rating dekhe + creator ka overall average (dusre comments nahi)
 * Server role khud tay karta hai (api.creator_ratings / api.rate_creator). Rating sirf post live hone ke baad.
 */
export function Stars({ value = 0, onPick, size = 20, label }) {
  const [hover, setHover] = useState(0);
  const v = hover || value;
  return (
    <span className="rc-stars" role={onPick ? "radiogroup" : "img"} aria-label={label || `${value} out of 5 stars`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) =>
        onPick ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`rc-star ${n <= v ? "is-on" : ""}`}
            style={{ fontSize: size }}
            onMouseEnter={() => setHover(n)}
            onClick={() => onPick(n)}
          >
            ★
          </button>
        ) : (
          <span key={n} className={`rc-star ${n <= Math.round(v) ? "is-on" : ""}`} style={{ fontSize: size }} aria-hidden="true">
            ★
          </span>
        )
      )}
    </span>
  );
}

const dt = (v) => {
  try {
    return v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
  } catch {
    return "";
  }
};

export default function RateCard({ door = "admin", pid = null, iid = null, title = "⭐ Rate card", className = "" }) {
  const on = !!(pid || iid);
  const r = useRpc(door, "api.creator_ratings", { p_participation: pid || null, p_invite: pid ? null : iid || null }, { skip: !on });
  const d = r.data || {};
  const role = d.role;
  const mine = (d.this || {})[role] || null;
  const other = (d.this || {})[role === "admin" ? "brand" : "admin"] || null;
  const [edit, setEdit] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (!on || r.error || (!r.data && r.loading)) return null;

  const start = () => {
    setStars(mine ? mine.stars : 0);
    setComment(mine ? mine.comment || "" : "");
    setMsg("");
    setEdit(true);
  };
  const save = async () => {
    if (!stars) return setMsg("⚠ Pick 1 to 5 stars.");
    setBusy(true);
    const { error } = await rpc(door, "api.rate_creator", { p_participation: pid || null, p_invite: pid ? null : iid || null, p_stars: stars, p_comment: comment.trim() || null });
    setBusy(false);
    if (error) return setMsg("⚠ " + errText(error));
    setEdit(false);
    setMsg(mine ? "Rating updated ✓" : "Rating saved ✓ — the creator can see it");
    r.reload(true);
  };

  const youLbl = role === "brand" ? "Your rating (brand)" : "Geek team rating";
  const otherLbl = role === "brand" ? "Geek team" : "Brand";

  return (
    <section className={`rc ${className}`}>
      <div className="rc-head">
        <h2 className="rc-h">{title}</h2>
        {d.count > 0 ? (
          <span className="rc-avg" title="Average of every rating this creator has got">
            <Stars value={Number(d.avg) || 0} size={15} />
            <b>{d.avg}</b>
            <em>
              {d.count} rating{d.count > 1 ? "s" : ""} · {d.campaigns} campaign{d.campaigns > 1 ? "s" : ""}
            </em>
          </span>
        ) : (
          <span className="rc-avg rc-muted">No ratings yet</span>
        )}
      </div>

      <div className="rc-grid">
        {/* this campaign — your side */}
        <div className="rc-box">
          <p className="rc-k">{youLbl} · this campaign</p>
          {!d.can_rate && !mine ? (
            <p className="rc-muted">Rating opens once the creator’s post is live.</p>
          ) : edit ? (
            <>
              <Stars value={stars} onPick={setStars} size={26} label="Pick a rating" />
              <textarea className="rc-in" rows={3} value={comment} maxLength={1000} placeholder="Comment — what went well, what didn’t (the creator sees this)" onChange={(e) => setComment(e.target.value)} />
              <div className="rc-acts">
                <button type="button" className="rc-btn is-pri" disabled={busy} onClick={save}>
                  {busy ? "Saving…" : "Save rating"}
                </button>
                <button type="button" className="rc-btn" onClick={() => setEdit(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : mine ? (
            <>
              <Stars value={mine.stars} size={18} />
              {mine.comment && <p className="rc-c">“{mine.comment}”</p>}
              <p className="rc-muted">
                {dt(mine.at)}
                {mine.by ? ` · ${mine.by}` : ""}
              </p>
              <button type="button" className="rc-btn" onClick={start}>
                ✎ Edit
              </button>
            </>
          ) : (
            <button type="button" className="rc-btn is-pri" onClick={start}>
              ⭐ Rate this creator
            </button>
          )}
        </div>
        {/* this campaign — the other side */}
        <div className="rc-box">
          <p className="rc-k">{otherLbl} · this campaign</p>
          {other ? (
            <>
              <Stars value={other.stars} size={18} />
              {other.comment && <p className="rc-c">“{other.comment}”</p>}
              <p className="rc-muted">
                {dt(other.at)}
                {other.by ? ` · ${other.by}` : ""}
              </p>
            </>
          ) : (
            <p className="rc-muted">Not rated yet.</p>
          )}
        </div>
      </div>

      {role === "admin" && Array.isArray(d.history) && d.history.length > 0 && (
        <div className="rc-hist">
          <p className="rc-k">Past campaigns</p>
          <ul>
            {d.history.map((h, i) => (
              <li key={i}>
                <div className="rc-hrow">
                  <Stars value={h.stars} size={13} />
                  <b>{h.campaign || "Campaign"}</b>
                  <span className="rc-muted">
                    {h.brand ? `${h.brand} · ` : ""}
                    {h.role === "brand" ? "by the brand" : `by Geek${h.by ? ` (${h.by})` : ""}`} · {dt(h.at)}
                  </span>
                </div>
                {h.comment && <p className="rc-c">“{h.comment}”</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {msg && <p className={`rc-msg ${msg.startsWith("⚠") ? "is-bad" : ""}`}>{msg}</p>}
      <style>{RC_CSS}</style>
    </section>
  );
}

/** Creator app: is campaign par mili ratings (api.my_campaign_ratings) */
export function MyRatings({ pid }) {
  const r = useRpc("creator", "api.my_campaign_ratings", { p_participation: pid }, { skip: !pid });
  const list = Array.isArray(r.data) ? r.data : [];
  if (!list.length) return null;
  return (
    <section className="rc rc--me">
      <h2 className="rc-h">⭐ Your rating on this campaign</h2>
      <div className="rc-grid">
        {list.map((x) => (
          <div key={x.role} className="rc-box">
            <p className="rc-k">{x.role === "brand" ? "From the brand" : "From the Geek team"}</p>
            <Stars value={x.stars} size={18} />
            {x.comment && <p className="rc-c">“{x.comment}”</p>}
            <p className="rc-muted">{dt(x.at)}</p>
          </div>
        ))}
      </div>
      <style>{RC_CSS}</style>
    </section>
  );
}

const RC_CSS = `
  .rc { margin-top: 14px; padding: 16px 18px; border-radius: 14px; background: #fff; border: 1px solid var(--ad-line-2, #e6e8ef); }
  .rc--me { background: #fffaf0; border-color: var(--bx-line, #eadfc8); }
  .rc-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  .rc-h { margin: 0; font-size: 16px; font-weight: 800; }
  .rc-avg { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; }
  .rc-avg em { font-style: normal; color: #7b8194; font-size: 12px; }
  .rc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 12px; }
  .rc-box { padding: 12px; border-radius: 12px; background: #f8f9fc; display: grid; gap: 6px; align-content: start; }
  .rc--me .rc-box { background: #fff; }
  .rc-k { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #9aa2b4; }
  .rc-stars { display: inline-flex; gap: 1px; line-height: 1; }
  .rc-star { border: 0; background: none; padding: 0 1px; color: #d9dce5; cursor: default; line-height: 1; }
  button.rc-star { cursor: pointer; }
  .rc-star.is-on { color: #f5b301; }
  .rc-c { margin: 0; font-size: 13px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
  .rc-muted { margin: 0; font-size: 12px; color: #7b8194; }
  .rc-in { width: 100%; padding: 8px 10px; border-radius: 10px; border: 1px solid #d9dce5; font: inherit; font-size: 13px; resize: vertical; }
  .rc-acts { display: flex; gap: 8px; flex-wrap: wrap; }
  .rc-btn { justify-self: start; padding: 7px 12px; border-radius: 10px; border: 1px solid #d9dce5; background: #fff; font-size: 12.5px; font-weight: 700; cursor: pointer; }
  .rc-btn.is-pri { border-color: #1d1f27; background: #1d1f27; color: #fff; }
  .rc-btn:disabled { opacity: .6; cursor: default; }
  .rc-hist { margin-top: 14px; }
  .rc-hist ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
  .rc-hist li { padding: 9px 11px; border-radius: 10px; border: 1px solid #eef0f5; }
  .rc-hrow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-size: 13px; }
  .rc-msg { margin: 10px 0 0; font-size: 12.5px; font-weight: 700; color: #1d7a45; }
  .rc-msg.is-bad { color: #b42335; }
`;
