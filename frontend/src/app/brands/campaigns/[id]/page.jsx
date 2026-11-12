"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import CampaignTop from "@/components/brands/CampaignTop";
import { getCampaign, getCreator, CAMPAIGN_CREATORS, STAGES } from "@/components/brands/data";
import { Search, Play, Instagram, ChevronDown, Check, Sparkle, ArrowRight } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "live", label: "Live", test: (r) => r.stage === "live" },
  { key: "progress", label: "In progress", test: (r) => r.stage === "making" || r.stage === "review" },
  { key: "you", label: "Needs you", test: (r) => r.stage === "review" || r.stage === "waiting" },
];

/** /brands/campaigns/[id] — campaign ke creators (pehla tab) */
export default function CampaignCreators() {
  const { id } = useParams();
  const c = getCampaign(id);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(8);
  const [approved, setApproved] = useState([]);
  const [toast, setToast] = useState("");
  if (!c) notFound();

  // Approve karne par stage "Making video" ho jaata hai
  const rows = CAMPAIGN_CREATORS.map((r) => (approved.includes(r.id) ? { ...r, stage: "making" } : r));
  const test = FILTERS.find((f) => f.key === filter).test;
  const list = rows.filter(test).filter((r) => {
    const cr = getCreator(r.id);
    const s = q.trim().toLowerCase();
    return !s || cr.name.toLowerCase().includes(s) || cr.handle.toLowerCase().includes(s);
  });
  const count = (f) => (f.key === "all" ? c.creators : rows.filter(f.test).length);

  const approve = (r) => {
    setApproved([...approved, r.id]);
    setToast(`${getCreator(r.id).name} approved — Geek will send her the brief`);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: c.title }]}>
      <title>{`${c.title} · Creators — Geek OS Brand`}</title>
      <CampaignTop c={c} />

      {c.status === "review" ? (
        <section className="br-card cc-plan">
          <span className="cc-plan__ic">
            <Sparkle size={18} />
          </span>
          <div className="cc-plan__txt">
            <h2>Geek is planning this campaign</h2>
            <p>
              Your plan and quote are ready — {c.creators} creators · {c.deliver} · {c.budget}. Once you OK the plan, Geek’s creator picks
              show up in Approvals.
            </p>
          </div>
          <Link href="/brands/approvals/requests" className="br-btn br-btn--primary">
            See plan &amp; quote <ArrowRight size={14} />
          </Link>
        </section>
      ) : (
        <>
          <div className="cc-bar">
            <div className="br-seg">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={filter === f.key ? "is-on" : ""}
                  onClick={() => {
                    setFilter(f.key);
                    setShown(8);
                  }}
                >
                  {f.label} {count(f)}
                </button>
              ))}
            </div>
            <label className="cc-search">
              <Search size={14} />
              <input type="search" placeholder="Search creators" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>

          <div className="br-table-wrap">
            <table className="br-table cc-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Stage</th>
                  <th>Video</th>
                  <th>Post</th>
                  <th>Views</th>
                  <th>Eng.</th>
                  <th>Fee</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.slice(0, shown).map((r) => {
                  const cr = getCreator(r.id);
                  const st = STAGES[r.stage];
                  const hot = r.stage === "review" || r.stage === "waiting";
                  return (
                    <tr key={r.id} className={hot ? "is-hot" : ""}>
                      <td>
                        <span className="br-who">
                          <span className="br-av br-av--sm" style={{ background: cr.av }}>
                            {cr.initials}
                          </span>
                          <span>
                            <strong>{cr.name}</strong>
                            <small>
                              {cr.handle} · {cr.followers}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className={`br-badge br-badge--${st.tone}`}>{st.label}</span>
                      </td>
                      <td>
                        {r.video === "ok" ? (
                          <span className="cc-ok">
                            <Play size={12} /> OK
                          </span>
                        ) : r.video === "review" ? (
                          <span className="cc-rev">
                            <Play size={12} /> Review
                          </span>
                        ) : (
                          <span className="cc-dash">—</span>
                        )}
                      </td>
                      <td>
                        {r.post ? (
                          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="cc-open">
                            <Instagram size={12} /> Open
                          </a>
                        ) : (
                          <span className="cc-dash">—</span>
                        )}
                      </td>
                      <td>
                        <strong>{r.views}</strong>
                      </td>
                      <td className="cc-muted">{r.eng}</td>
                      <td>
                        <strong>{r.fee}</strong>
                      </td>
                      <td>
                        {r.stage === "review" ? (
                          <Link href={`/brands/approvals/video/${r.id}`} className="br-btn br-btn--primary br-btn--sm">
                            Watch
                          </Link>
                        ) : r.stage === "waiting" ? (
                          <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={() => approve(r)}>
                            Approve
                          </button>
                        ) : (
                          <Link href={`/brands/creators/${r.id}`} className="br-btn br-btn--ghost br-btn--sm">
                            Profile
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={8} className="cc-empty">
                      No creators here yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {list.length > shown && (
              <div className="br-more cc-more">
                <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 8)}>
                  Load more <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .cc-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .cc-search {
          display: flex; align-items: center; gap: 8px; width: 240px; height: 38px; padding: 0 12px;
          border: 1px solid var(--br-border); border-radius: 10px; background: #fff; color: var(--br-faint);
        }
        .cc-search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 13px; }
        .cc-table tr.is-hot td { background: #fafafd; }
        .cc-ok, .cc-rev, .cc-open { display: inline-flex; align-items: center; gap: 5px; font-weight: 700; font-size: 12.5px; }
        .cc-ok { color: var(--br-green); }
        .cc-rev { color: var(--br-orange); }
        .cc-open { color: var(--br-primary); }
        .cc-dash { color: var(--br-faint); }
        .cc-muted { color: var(--br-muted); }
        .cc-empty { text-align: center; color: var(--br-muted); padding: 28px !important; }
        .cc-more { padding: 4px 0 16px; margin-top: 12px; }

        .cc-plan { display: flex; align-items: center; gap: 16px; padding: 22px; flex-wrap: wrap; }
        .cc-plan__ic { width: 44px; height: 44px; border-radius: 12px; background: var(--br-orange-bg); color: var(--br-orange); display: grid; place-items: center; flex-shrink: 0; }
        .cc-plan__txt { flex: 1; min-width: 240px; }
        .cc-plan h2 { margin: 0 0 4px; font-size: 16px; font-weight: 800; }
        .cc-plan p { margin: 0; font-size: 13px; line-height: 1.55; color: var(--br-muted); }

        @media (max-width: 640px) {
          .cc-bar { flex-direction: column; align-items: stretch; }
          .cc-search { width: 100%; }
          .cc-plan .br-btn { width: 100%; }
        }
      `}</style>
    </BrandShell>
  );
}
