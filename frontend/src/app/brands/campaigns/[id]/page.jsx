"use client";

import { useState } from "react";
import Link from "next/link";
import CampaignFrame from "@/components/brands/CampaignFrame";
import { useToast } from "@/components/brands/BrandStates";
import { useApprovals, approveCreator, creatorHref, bWho, bSum, bShort, bEr, B_STAGE_TONE } from "@/services/brand";
import { Search, Play, Instagram, ChevronDown, Sparkle, ArrowRight } from "@/components/ui/Icons";

// brand ke stage keys (intel.ci_brand_stage) se filters
const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "live", label: "Live", test: (k) => k === "posted" || k === "posting" },
  { key: "progress", label: "In progress", test: (k) => ["approved", "shipped", "making", "video_review"].includes(k) },
  { key: "you", label: "Needs you", test: (k) => k === "to_approve" || k === "video_review" },
];

/** /brands/campaigns/[id] — campaign ke creators (purana paintTab "creators": status, video, posts, approve / watch) */
export default function CampaignCreators() {
  return (
    <>
      <CampaignFrame tab="Creators">{(d, c, reload) => <CreatorsTab d={d} c={c} reload={reload} />}</CampaignFrame>

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
    </>
  );
}

function CreatorsTab({ d, c, reload }) {
  const a = useApprovals();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(8);
  const [busy, setBusy] = useState("");
  const [toast, say] = useToast();

  const rows = (d.creators || []).filter((r) => (r.status || {}).key !== "not_selected");
  const key = (r) => (r.status || {}).key;
  const test = FILTERS.find((f) => f.key === filter).test;
  const s = q.trim().toLowerCase();
  const list = rows.filter((r) => test(key(r))).filter((r) => {
    const cr = r.creator || {};
    return !s || String(cr.name || "").toLowerCase().includes(s) || String(cr.username || "").toLowerCase().includes(s);
  });
  const count = (f) => rows.filter((r) => f.test(key(r))).length;

  // purana data-bpxok (campaign ke andar bhi)
  const approve = async (r) => {
    setBusy(r.participation_id);
    const x = await approveCreator(r.participation_id);
    setBusy("");
    if (x.error) return say(x.error.message);
    say("✓ Creator approved — the Geek team takes it from here");
    reload();
    a.reload();
  };

  if (c.status === "review")
    return (
      <section className="br-card cc-plan">
        <span className="cc-plan__ic">
          <Sparkle size={18} />
        </span>
        <div className="cc-plan__txt">
          <h2>Geek is setting up this campaign</h2>
          <p>
            {c.statusLabel} · {c.deliver}. Once it’s live, Geek’s creator picks show up in Approvals for your OK.
          </p>
        </div>
        <Link href={`/brands/campaigns/${c.id}/brief`} className="br-btn br-btn--primary">
          See the brief <ArrowRight size={14} />
        </Link>
      </section>
    );

  return (
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
              <th>City</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.slice(0, shown).map((r) => {
              const cr = bWho(r.creator);
              const k = key(r);
              const hot = k === "to_approve" || k === "video_review";
              const posts = r.posts || [];
              const post = posts.find((p) => p.permalink);
              const tot = { views: bSum(posts, "views"), likes: bSum(posts, "likes"), comments: bSum(posts, "comments"), shares: bSum(posts, "shares"), saves: bSum(posts, "saves") };
              const v = r.video || {};
              const href = creatorHref(r.participation_id, r.invite_id);
              return (
                <tr key={r.participation_id || r.invite_id} className={hot ? "is-hot" : ""}>
                  <td>
                    <span className="br-who">
                      <span className="br-av br-av--sm" style={{ background: cr.av }}>
                        {cr.initials}
                      </span>
                      <span>
                        <strong>{cr.name}</strong>
                        <small>{[cr.handle, cr.followers !== "—" ? cr.followers : ""].filter(Boolean).join(" · ")}</small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={`br-badge br-badge--${B_STAGE_TONE[k] || "grey"}`}>{(r.status || {}).label || "—"}</span>
                  </td>
                  <td>
                    {v.url && (k === "posting" || k === "posted") ? (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="cc-ok">
                        <Play size={12} /> OK
                      </a>
                    ) : v.url && k === "video_review" ? (
                      <Link href={`/brands/approvals/video/${r.participation_id}`} className="cc-rev">
                        <Play size={12} /> Review
                      </Link>
                    ) : v.url ? (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="cc-rev">
                        <Play size={12} /> Watch
                      </a>
                    ) : (
                      <span className="cc-dash">—</span>
                    )}
                  </td>
                  <td>
                    {post ? (
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="cc-open">
                        <Instagram size={12} /> Open{posts.length > 1 ? ` (${posts.length})` : ""}
                      </a>
                    ) : (
                      <span className="cc-dash">—</span>
                    )}
                  </td>
                  <td>
                    <strong>{posts.length ? bShort(tot.views) : "—"}</strong>
                  </td>
                  <td className="cc-muted">{posts.length ? bEr(tot) : "—"}</td>
                  <td className="cc-muted">{cr.city || "—"}</td>
                  <td>
                    {k === "video_review" && r.participation_id ? (
                      <Link href={`/brands/approvals/video/${r.participation_id}`} className="br-btn br-btn--primary br-btn--sm">
                        Watch
                      </Link>
                    ) : k === "to_approve" && r.participation_id && a.can ? (
                      <button type="button" className="br-btn br-btn--primary br-btn--sm" disabled={!!busy} onClick={() => approve(r)}>
                        {busy === r.participation_id ? "…" : "Approve"}
                      </button>
                    ) : href ? (
                      <Link href={href} className="br-btn br-btn--ghost br-btn--sm">
                        Profile
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="cc-empty">
                  {rows.length ? "No creators here." : "No creators on this campaign yet — Geek adds them as they’re picked."}
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
      {toast}
    </>
  );
}
