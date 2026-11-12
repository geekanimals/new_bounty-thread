"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import DiscoveryTabs from "@/components/brands/DiscoveryTabs";
import { SHORTLIST, getCreator } from "@/components/brands/data";
import { Trash, Layers, Send, Check, ChevronDown, Compass } from "@/components/ui/Icons";

// "412K" → 412000, "₹38K" → 38000
const num = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /M/i.test(s) ? n * 1e6 : /K/i.test(s) ? n * 1000 : n;
};
const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`);
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/** /brands/discovery/shortlist — chune hue creators + Geek ko bhejna */
export default function DiscoveryShortlist() {
  const [rows, setRows] = useState(SHORTLIST);
  const [shown, setShown] = useState(6);
  const [sent, setSent] = useState(false);

  const list = rows.map((r) => ({ ...r, c: getCreator(r.id) }));
  const reach = list.reduce((s, r) => s + num(r.c.followers), 0);
  // estimated fees: har creator ki fee ka total (final price Geek confirm karta hai)
  const fees = list.reduce((s, r) => s + num(r.c.fee), 0);
  const eng = list.length ? list.reduce((s, r) => s + parseFloat(r.c.eng), 0) / list.length : 0;

  const setNote = (id, note) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, note } : r)));
  const remove = (id) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
    setSent(false);
  };

  return (
    <BrandShell>
      <title>My shortlist — Geek OS Brand</title>
      <DiscoveryTabs />

      <div className="ds">
        <section className="ds-main">
          {list.length ? (
            <div className="br-table-wrap">
              <table className="br-table">
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>For campaign</th>
                    <th>Fee</th>
                    <th>Your note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, shown).map(({ id, c, campaign, note }) => (
                    <tr key={id}>
                      <td>
                        <Link href={`/brands/creators/${id}`} className="br-who">
                          <span className="br-av br-av--sm" style={{ background: c.av }}>
                            {c.initials}
                          </span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>
                              {c.handle} · {c.followers}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="br-badge br-badge--violet">{campaign}</span>
                      </td>
                      <td>
                        <b>{c.fee}</b>
                      </td>
                      <td className="ds-notecell">
                        <input className="ds-note" value={note} onChange={(e) => setNote(id, e.target.value)} aria-label={`Note for ${c.name}`} />
                      </td>
                      <td>
                        <button type="button" className="ds-del" aria-label={`Remove ${c.name}`} onClick={() => remove(id)}>
                          <Trash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown < list.length && (
                <div className="br-more ds-more">
                  <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 6)}>
                    Load more <ChevronDown size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="br-card ds-empty">
              <Compass size={22} />
              <h2>Your shortlist is empty</h2>
              <p>Star or shortlist creators in Discovery and they’ll show up here.</p>
              <Link href="/brands/discovery" className="br-btn br-btn--primary">
                Find creators
              </Link>
            </div>
          )}
        </section>

        {/* Summary */}
        <aside className="ds-sum">
          <p className="ds-sum__eyebrow">Shortlist</p>
          <p className="ds-sum__count">
            {list.length} creator{list.length === 1 ? "" : "s"}
          </p>
          <dl>
            <div>
              <dt>Total reach</dt>
              <dd>{short(reach)} followers</dd>
            </div>
            <div>
              <dt>Estimated fees</dt>
              <dd>{inr(fees)}</dd>
            </div>
            <div>
              <dt>Avg engagement</dt>
              <dd>{eng.toFixed(1)}%</dd>
            </div>
          </dl>
          <p className="ds-sum__note">Geek checks availability and final prices, then puts them in Approvals for you.</p>
          <Link href="/brands/discovery/compare" className={`ds-sum__compare ${list.length < 2 ? "is-off" : ""}`}>
            <Layers size={14} /> Compare side by side
          </Link>
          {sent ? (
            <p className="ds-sum__sent">
              <Check size={14} /> Sent to Geek — they’ll reply within 24 hours
            </p>
          ) : (
            <button type="button" className="ds-sum__send" disabled={!list.length} onClick={() => setSent(true)}>
              <Send size={14} /> Send shortlist to Geek
            </button>
          )}
        </aside>
      </div>

      <style>{`
        .ds { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
        .ds-main td b { font-weight: 800; }
        .ds-notecell { width: 34%; }
        .ds-note {
          width: 100%; min-width: 180px; height: 34px; padding: 0 10px; border: 1px solid transparent; border-radius: 8px;
          background: transparent; font-size: 13px; color: var(--br-text); outline: none;
        }
        .ds-note:hover { border-color: var(--br-border); }
        .ds-note:focus { border-color: var(--br-primary); background: #fff; box-shadow: 0 0 0 3px rgba(109,74,255,.12); }
        .ds-del { width: 32px; height: 32px; border-radius: 9px; border: 0; background: #f1f2f7; color: var(--br-muted); display: grid; place-items: center; }
        .ds-del:hover { background: var(--br-red-bg); color: var(--br-red); }
        .ds-more { padding: 6px 0 16px; }
        .ds-empty { padding: 40px 20px; text-align: center; color: var(--br-primary); }
        .ds-empty h2 { margin: 10px 0 4px; font-size: 17px; color: var(--br-ink); }
        .ds-empty p { margin: 0 0 16px; font-size: 13px; color: var(--br-muted); }

        .ds-sum {
          position: sticky; top: 92px; padding: 20px; border-radius: 18px; color: #fff;
          background: radial-gradient(120% 120% at 100% 0%, #5b1a4a 0%, rgba(91,26,74,0) 60%), linear-gradient(160deg, #14112e, #231a4a);
        }
        .ds-sum__eyebrow { margin: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #ff8fb1; }
        .ds-sum__count { margin: 8px 0 14px; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
        .ds-sum dl { margin: 0; display: grid; gap: 10px; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.1); }
        .ds-sum dl div { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
        .ds-sum dt { color: #b9b4e0; }
        .ds-sum dd { margin: 0; font-weight: 700; }
        .ds-sum__note { margin: 14px 0; font-size: 12px; line-height: 1.55; color: #b9b4e0; }
        .ds-sum__compare, .ds-sum__send {
          display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 42px;
          border-radius: 11px; font-size: 13.5px; font-weight: 700;
        }
        .ds-sum__compare { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); color: #fff; margin-bottom: 8px; }
        .ds-sum__compare:hover { background: rgba(255,255,255,.18); }
        .ds-sum__compare.is-off { opacity: .5; pointer-events: none; }
        .ds-sum__send { border: 0; background: #fff; color: var(--br-ink); }
        .ds-sum__send:disabled { opacity: .5; cursor: not-allowed; }
        .ds-sum__sent { display: flex; align-items: center; gap: 8px; margin: 0; padding: 11px 12px; border-radius: 11px; background: rgba(34,197,94,.16); color: #86efac; font-size: 13px; font-weight: 600; }

        @media (max-width: 1100px) {
          .ds { grid-template-columns: minmax(0, 1fr); }
          .ds-sum { position: static; }
        }
      `}</style>
    </BrandShell>
  );
}
