"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrEmpty, BrError, useToast } from "@/components/brands/BrandStates";
import { useBrandCampaigns, campaignPdf, bCampaignCard, bDate, bGrad, B_REQ } from "@/services/brand";
import { Plus, Search, ChevronDown, Download } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "review", label: "In review" },
  { key: "completed", label: "Completed" },
];

/**
 * /brands/campaigns — brand ke saare campaigns (purana paintCampaignList: api.brand_portal campaigns + khule requests).
 * Khule requests "In review" cards ban kar dikhte hain (Campaign requests page par khulte hain).
 */
export default function BrandCampaigns() {
  const d = useBrandCampaigns();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(4);
  const [toast, say] = useToast();

  const camps = d.list.map(bCampaignCard);
  const reqs = d.requests
    .filter((r) => r.status === "new" || r.status === "in_review")
    .map((r) => ({ id: r.request_id, req: true, title: r.name, status: "review", statusLabel: B_REQ[r.status], dates: `Requested · ${bDate(r.created_at)}`, gradient: bGrad(r.request_id) }));
  const all = [...reqs, ...camps];
  const count = (k) => (k === "all" ? all.length : all.filter((c) => c.status === k).length);
  const s = q.trim().toLowerCase();
  const cards = all.filter((c) => (filter === "all" ? c.status !== "completed" || s : c.status === filter)).filter((c) => c.title.toLowerCase().includes(s));
  const completed = camps.filter((c) => c.status === "completed");

  const pdf = async (c) => {
    const r = await campaignPdf(c.id);
    if (r.error) say(r.error.message);
  };

  return (
    <BrandShell>
      <title>Campaigns — Geek OS Brand</title>

      <div className="br-head">
        <div>
          <h1 className="br-h1">Campaigns</h1>
          <p className="br-sub">Every campaign Geek runs for {d.brand} — live numbers, posts and reports.</p>
        </div>
        {d.can && (
          <Link href="/brands/campaigns/new" className="br-btn br-btn--primary">
            <Plus size={15} /> Request a campaign
          </Link>
        )}
      </div>

      {d.loading ? (
        <BrLoading cards={4} />
      ) : d.error ? (
        <BrError error={d.error} onRetry={d.reload} />
      ) : !all.length ? (
        <BrEmpty title="No campaigns yet" text="Your campaigns with Geek show up here — with every creator, video and post. Send a request to get started.">
          {d.can && (
            <Link href="/brands/campaigns/new" className="br-btn br-btn--primary br-btn--sm">
              <Plus size={14} /> Request a campaign
            </Link>
          )}
        </BrEmpty>
      ) : (
        <>
          <div className="bc-bar">
            <div className="br-seg">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? "is-on" : ""}
                  onClick={() => {
                    setFilter(f.key);
                    setShown(4);
                  }}
                >
                  {f.label} {count(f.key)}
                </button>
              ))}
            </div>
            <label className="bc-search">
              <Search size={14} />
              <input type="search" placeholder="Search campaigns" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>

          {cards.length === 0 ? (
            <div className="br-card bc-empty">
              <p>{s ? `No campaigns match “${q}”.` : "No campaigns here yet."}</p>
              {s && (
                <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => setQ("")}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="bc-grid">
              {cards.slice(0, shown).map((c) => (
                <article key={c.id} className="br-card bc-card">
                  <div className="bc-cover" style={{ background: c.gradient }}>
                    <span className={`bc-pill bc-pill--${c.status}`}>{c.statusLabel || (c.status === "review" ? "In review" : "Live")}</span>
                  </div>
                  <div className="bc-body">
                    <h2>{c.title}</h2>
                    <p className="bc-dates">{c.dates}</p>
                    <div className="bc-nums">
                      <span>
                        <strong>{c.req ? "—" : c.type || "—"}</strong>
                        <small>type</small>
                      </span>
                      <span>
                        <strong>{c.req ? "—" : c.creators}</strong>
                        <small>creators</small>
                      </span>
                      <span>
                        <strong>{c.req ? "—" : c.toApprove}</strong>
                        <small>to approve</small>
                      </span>
                      <span>
                        <strong>{c.req ? "—" : c.videoReview}</strong>
                        <small>videos</small>
                      </span>
                    </div>
                    <div className="bc-prog">
                      <span>Posts live</span>
                      <strong>{c.req ? "—" : `${c.posts} / ${c.planned}`}</strong>
                    </div>
                    <span className="br-bar">
                      <i style={{ width: `${c.req ? 3 : Math.min(100, Math.max(3, (c.posts / c.planned) * 100))}%` }} />
                    </span>
                    <div className="bc-actions">
                      {c.req ? (
                        <Link href="/brands/approvals/requests" className="br-btn br-btn--ghost br-btn--sm">
                          See request
                        </Link>
                      ) : (
                        <>
                          <Link href={`/brands/campaigns/${c.id}`} className="br-btn br-btn--ghost br-btn--sm">
                            Open campaign
                          </Link>
                          <Link href={`/brands/campaigns/${c.id}/analytics`} className="br-btn br-btn--soft br-btn--sm">
                            Report
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {cards.length > shown && (
            <div className="br-more">
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 4)}>
                Load more <ChevronDown size={14} />
              </button>
            </div>
          )}

          {/* Completed — final reports */}
          {filter === "all" && !s && completed.length > 0 && (
            <section className="br-card bc-done">
              <h2 className="br-card__title">Completed</h2>
              <p className="br-card__sub">Final reports are ready to download</p>
              <ul>
                {completed.map((c) => (
                  <li key={c.id}>
                    <Link href={`/brands/campaigns/${c.id}`} className="bc-done__name">
                      <span style={{ background: c.gradient }} />
                      {c.title}
                    </Link>
                    <span className="bc-done__date">{c.dates}</span>
                    <span className="bc-done__views">{c.posts} posts</span>
                    <span className="bc-done__sales">{c.posted} creators posted</span>
                    <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => pdf(c)}>
                      <Download size={13} /> PDF report
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {toast}

      <style>{`
        .bc-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
        .bc-search {
          display: flex; align-items: center; gap: 8px; width: 260px; height: 38px; padding: 0 12px;
          border: 1px solid var(--br-border); border-radius: 10px; background: #fff; color: var(--br-faint);
        }
        .bc-search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13px; }

        .bc-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .bc-card { overflow: hidden; border-radius: 18px; }
        .bc-cover { position: relative; height: 118px; display: flex; align-items: flex-start; justify-content: space-between; padding: 16px; }
        .bc-pill {
          display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px;
          border-radius: 999px; background: #fff; font-size: 11.5px; font-weight: 700;
        }
        .bc-pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .bc-pill--live { color: var(--br-green); }
        .bc-pill--review { color: var(--br-orange); }
        .bc-pill--completed { color: var(--br-text); }
        .bc-stack { display: flex; }
        .bc-stack .br-av { border: 2px solid #fff; margin-left: -8px; }
        .bc-body { padding: 18px 20px 20px; }
        .bc-body h2 { margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
        .bc-dates { margin: 3px 0 16px; font-size: 12.5px; color: var(--br-muted); }
        .bc-nums { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .bc-nums span:last-child { text-align: right; }
        .bc-nums strong { display: block; font-size: 15px; font-weight: 800; }
        .bc-nums small { display: block; font-size: 11px; color: var(--br-faint); }
        .bc-prog { display: flex; justify-content: space-between; margin: 16px 0 6px; font-size: 12px; color: var(--br-muted); }
        .bc-prog strong { color: var(--br-ink); }
        .bc-actions { display: flex; gap: 8px; margin-top: 16px; }

        .bc-empty { padding: 30px; text-align: center; }
        .bc-empty p { margin: 0 0 12px; color: var(--br-muted); }

        .bc-done { margin-top: 26px; padding: 20px 22px 8px; }
        .bc-done ul { list-style: none; margin: 12px 0 0; padding: 0; }
        .bc-done li {
          display: grid; grid-template-columns: minmax(0, 2fr) 1fr 1fr 1fr auto; align-items: center; gap: 14px;
          padding: 12px 0; border-top: 1px solid var(--br-border); font-size: 13px;
        }
        .bc-done__name { display: flex; align-items: center; gap: 12px; font-weight: 700; min-width: 0; }
        .bc-done__name span { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; }
        .bc-done__name:hover { color: var(--br-primary); }
        .bc-done__date { color: var(--br-muted); }
        .bc-done__views { font-weight: 700; }
        .bc-done__sales { font-weight: 700; color: var(--br-green); }

        @media (max-width: 900px) {
          .bc-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .bc-bar { flex-direction: column; align-items: stretch; }
          .bc-search { width: 100%; }
          .bc-nums { grid-template-columns: repeat(2, 1fr); row-gap: 12px; }
          .bc-nums span:last-child { text-align: left; }
          .bc-actions .br-btn { flex: 1; }
          .bc-done { padding: 18px 16px 6px; }
          .bc-done li { grid-template-columns: 1fr 1fr; row-gap: 6px; }
          .bc-done__name { grid-column: 1 / -1; }
          .bc-done li .br-btn { grid-column: 1 / -1; }
        }
      `}</style>
    </BrandShell>
  );
}
