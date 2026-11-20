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
  // jo creators brand ka wait kar rahe hain — kholte hi wahi dikhein
  const [filter, setFilter] = useState(() => ((d.creators || []).some((r) => ["to_approve", "video_review"].includes((r.status || {}).key)) ? "you" : "all"));
  const [sel, setSel] = useState([]);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(8);
  const [busy, setBusy] = useState("");
  const [toast, say] = useToast();

  const rows = (d.creators || []).filter((r) => (r.status || {}).key !== "not_selected");
  const key = (r) => (r.status || {}).key;
  const test = FILTERS.find((f) => f.key === filter).test;
  const s = q.trim().toLowerCase();
  const hotK = (r) => (["to_approve", "video_review"].includes(key(r)) ? 0 : 1);
  const list = rows
    .filter((r) => test(key(r)))
    .filter((r) => {
      const cr = r.creator || {};
      return !s || String(cr.name || "").toLowerCase().includes(s) || String(cr.username || "").toLowerCase().includes(s);
    })
    .sort((x, y) => hotK(x) - hotK(y));
  const pickable = list.filter((r) => key(r) === "to_approve" && r.participation_id && a.can).map((r) => r.participation_id);
  const toggle = (pid) => setSel((v) => (v.includes(pid) ? v.filter((x) => x !== pid) : [...v, pid]));
  const count = (f) => rows.filter((r) => f.test(key(r))).length;
  const appliedN = Number(d.applied_count) || 0,
    screeningN = Number(d.screening_count) || 0;

  // purana data-bpxok (campaign ke andar bhi)
  const approve = async (r) => {
    setBusy(r.participation_id);
    const x = await approveCreator(r.participation_id);
    setBusy("");
    if (x.error) return say(x.error.message);
    say("✓ Creator approved — the Geek team takes it from here");
    setSel((v) => v.filter((x) => x !== r.participation_id));
    reload();
    a.reload();
  };
  // ek saath approve (tick kiye hue)
  const approveMany = async () => {
    const ids = sel.filter((x) => pickable.includes(x));
    if (!ids.length) return;
    if (!window.confirm(`Approve ${ids.length} creator${ids.length > 1 ? "s" : ""} for this campaign?`)) return;
    setBusy("many");
    let ok = 0;
    const bad = [];
    for (const pid of ids) {
      const x = await approveCreator(pid);
      if (x.error) bad.push(x.error.message);
      else ok += 1;
    }
    setBusy("");
    setSel([]);
    say(bad.length ? `✓ ${ok} approved · ${bad.length} not approved: ${bad[0]}` : `✓ ${ok} creator${ok > 1 ? "s" : ""} approved — the Geek team takes it from here`);
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
      {appliedN > 0 && (
        <p className="cc-applied">
          📥 <b>{appliedN} applied</b>
          {screeningN > 0 ? ` · ${screeningN} being screened by the Geek team` : ""} · you see the creators the Geek team shortlists for you.
          <style>{`.cc-applied { margin: 0 0 12px; padding: 10px 14px; border-radius: 12px; background: #f5f3ff; border: 1px solid #e3dfff; font-size: 13px; color: #4b4380; }`}</style>
        </p>
      )}
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

      {pickable.length > 0 && (
        <div className="cc-bulk">
          <label>
            <input type="checkbox" checked={pickable.every((x) => sel.includes(x))} onChange={(e) => setSel(e.target.checked ? pickable : [])} /> Select all waiting for you ({pickable.length})
          </label>
          <button type="button" className="br-btn br-btn--primary br-btn--sm" disabled={!sel.length || !!busy} onClick={approveMany}>
            {busy === "many" ? "Approving…" : `Approve selected (${sel.filter((x) => pickable.includes(x)).length})`}
          </button>
          <span className="cc-bulk__hint">Tap Profile to see each creator’s numbers, posts and fit before you approve.</span>
          <style>{`
            .cc-bulk { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 12px; padding: 10px 14px; border-radius: 12px; background: #fff8ec; border: 1px solid #f3dfb5; font-size: 13px; }
            .cc-bulk label { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; }
            .cc-bulk__hint { color: #8a6b32; font-size: 12.5px; }
            .cc-table .br-who { display: inline-flex; vertical-align: middle; }
            .cc-pick { width: 16px; height: 16px; margin-right: 10px; vertical-align: middle; cursor: pointer; }
            .cc-acts { display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
          `}</style>
        </div>
      )}
      <div className="br-table-wrap">
        <table className="br-table cc-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Stage</th>
              <th>Video</th>
              <th>Post</th>
              <th>Followers</th>
              <th>Views</th>
              <th>Likes</th>
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
              // views tabhi jab kisi post ke stats aaye hon — warna "0" galat lagta hai (Instagram juda nahi)
              const hasStats = posts.some((p) => p.stats && (p.stats.views != null || p.stats.likes != null));
              const href = creatorHref(r.participation_id, r.invite_id);
              return (
                <tr key={r.participation_id || r.invite_id} className={hot ? "is-hot" : ""}>
                  <td>
                    {k === "to_approve" && r.participation_id && a.can && <input type="checkbox" className="cc-pick" checked={sel.includes(r.participation_id)} onChange={() => toggle(r.participation_id)} aria-label={`Select ${cr.name}`} />}
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
                    ) : k === "posting" || k === "posted" ? (
                      <span className="cc-ok" title="Approved — posted without a video upload here">✓ OK</span>
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
                  <td className="cc-muted">{cr.followers !== "—" ? cr.followers : "—"}</td>
                  <td>
                    {hasStats ? (
                      <strong>{bShort(tot.views)}</strong>
                    ) : (
                      <span className="cc-dash" title={posts.length ? "Views not available yet — this creator's Instagram isn't connected to Geek OS" : ""}>
                        —
                      </span>
                    )}
                  </td>
                  <td>{hasStats ? <strong>{bShort(tot.likes)}</strong> : <span className="cc-dash">—</span>}</td>
                  <td className="cc-muted">{hasStats ? bEr(tot) : "—"}</td>
                  <td className="cc-muted">{cr.city || "—"}</td>
                  <td>
                    {k === "video_review" && r.participation_id ? (
                      <Link href={`/brands/approvals/video/${r.participation_id}`} className="br-btn br-btn--primary br-btn--sm">
                        Watch
                      </Link>
                    ) : k === "to_approve" && r.participation_id && a.can ? (
                      <span className="cc-acts">
                        {href && (
                          <Link href={href} className="br-btn br-btn--ghost br-btn--sm">
                            Profile
                          </Link>
                        )}
                        <button type="button" className="br-btn br-btn--primary br-btn--sm" disabled={!!busy} onClick={() => approve(r)}>
                          {busy === r.participation_id ? "…" : "Approve"}
                        </button>
                        <Link href={`/brands/approvals/decline/${r.participation_id}`} className="br-btn br-btn--ghost br-btn--sm">
                          Not for us
                        </Link>
                      </span>
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
