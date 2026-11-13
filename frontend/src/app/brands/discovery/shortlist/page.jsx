"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import DiscoveryTabs from "@/components/brands/DiscoveryTabs";
import { BrLoading, BrError, BrAvatar, useToast } from "@/components/brands/BrandStates";
import { useBrand, canAct, usePicks, unpickCreator, PICK_STATUS, short, fdate, igUrl } from "@/services/brand";
import { Trash, Layers, Send, Check, ChevronDown, Compass } from "@/components/ui/Icons";

/**
 * /brands/discovery/shortlist — purana dxPicks: api.brand_discover_picks (status: with Geek / invited / not this time),
 * Remove (sirf "new" wale) → api.brand_discover_unpick. Shortlist pick karte hi Geek team ko pahunch jaati hai (alag "send" nahi).
 */
export default function DiscoveryShortlist() {
  const b = useBrand();
  const act = canAct(b);
  const picks = usePicks();
  const [toast, say] = useToast();
  const [shown, setShown] = useState(6);
  const [busy, setBusy] = useState("");

  const list = picks.list.map((k) => ({ ...k, s0: k.snapshot || {} }));
  const reach = list.reduce((a, r) => a + (Number(r.s0.followers) || 0), 0);
  const invited = list.filter((r) => r.status === "invited").length;
  const engL = list.filter((r) => r.s0.engagement != null);
  const eng = engL.length ? engL.reduce((a, r) => a + Number(r.s0.engagement), 0) / engL.length : 0;

  const remove = async (r) => {
    setBusy(r.pick_id);
    const x = await unpickCreator(r.pick_id);
    setBusy("");
    say(x.error ? x.error.message : `@${r.handle} removed`);
    if (!x.error) picks.reload();
  };

  return (
    <BrandShell>
      <title>My shortlist — Geek OS Brand</title>
      <DiscoveryTabs />

      <div className="ds">
        <section className="ds-main">
          {picks.loading && !list.length ? (
            <BrLoading rows={4} />
          ) : picks.error && !list.length ? (
            <BrError error={picks.error} onRetry={picks.reload} />
          ) : list.length ? (
            <div className="br-table-wrap">
              <table className="br-table">
                <thead>
                  <tr>
                    <th>Creator</th>
                    <th>For campaign</th>
                    <th>Status</th>
                    <th>Your note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.slice(0, shown).map((r) => {
                    const st = PICK_STATUS[r.status] || [r.status, "grey"];
                    return (
                      <tr key={r.pick_id}>
                        <td>
                          <a href={igUrl(r.handle)} target="_blank" rel="noreferrer" className="br-who">
                            <BrAvatar name={r.s0.name || r.handle} src={r.s0.profile_picture_url} cls="br-av--sm" />
                            <span>
                              <strong>{r.s0.name || "@" + r.handle}</strong>
                              <small>
                                @{r.handle}
                                {r.s0.followers != null ? ` · ${short(r.s0.followers)}` : ""}
                                {r.s0.city ? ` · ${r.s0.city}` : ""}
                              </small>
                            </span>
                          </a>
                        </td>
                        <td>
                          <span className={`br-badge br-badge--${r.campaign ? "violet" : "plain"}`}>{r.campaign || "No campaign yet"}</span>
                        </td>
                        <td>
                          <span className={`br-badge br-badge--${st[1]}`}>{st[0]}</span>
                        </td>
                        <td className="ds-notecell">
                          <span className="ds-notetxt">
                            {r.note || "—"}
                            {r.admin_note && <small>Geek team: {r.admin_note}</small>}
                            <small>
                              {fdate(r.added_at)}
                              {r.by ? ` · by ${r.by}` : ""}
                            </small>
                          </span>
                        </td>
                        <td>
                          {r.status === "new" && act && (
                            <button type="button" className="ds-del" aria-label={`Remove @${r.handle}`} onClick={() => remove(r)} disabled={busy === r.pick_id}>
                              <Trash size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
              <p>Shortlist creators in Discovery and they’ll show up here.</p>
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
              <dt>Invited by Geek</dt>
              <dd>
                {invited} of {list.length}
              </dd>
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
          {list.length ? (
            <p className="ds-sum__sent">
              <Check size={14} /> Already with Geek — every creator you shortlist reaches the team right away
            </p>
          ) : (
            <button type="button" className="ds-sum__send" disabled>
              <Send size={14} /> Send shortlist to Geek
            </button>
          )}
        </aside>
      </div>
      {toast}

      <style>{`
        .ds { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
        .ds-main td b { font-weight: 800; }
        .ds-notecell { width: 34%; }
        .ds-notetxt { display: block; white-space: normal; font-size: 13px; color: var(--br-text); }
        .ds-notetxt small { display: block; font-size: 11.5px; color: var(--br-muted); }
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
