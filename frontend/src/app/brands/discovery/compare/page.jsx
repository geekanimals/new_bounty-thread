"use client";

import { useEffect, useState } from "react";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrError, BrEmpty, BrAvatar, useToast } from "@/components/brands/BrandStates";
import { usePicks, PICK_STATUS, short as fmt, igUrl } from "@/services/brand";
import Link from "next/link";
import { Download, Sparkle, Close, Plus, Check, Bookmark } from "@/components/ui/Icons";

const eng1 = (v) => (v == null ? null : Math.round(Number(v) * 10) / 10);
// Har row: value + "best" kaun (max) — shortlist ke snapshot (api.brand_discover_picks) se
const ROWS = [
  { key: "followers", label: "Followers", val: (c) => Number(c.s0.followers) || 0, show: (c) => (c.s0.followers != null ? fmt(c.s0.followers) : "—"), best: "max" },
  { key: "eng", label: "Engagement", hint: "likes + comments", val: (c) => Number(c.s0.engagement) || 0, show: (c) => (c.s0.engagement != null ? `${eng1(c.s0.engagement)}%` : "—"), best: "max" },
  { key: "city", label: "City", show: (c) => c.s0.city || "—" },
  { key: "campaign", label: "For campaign", show: (c) => c.campaign || "No campaign yet" },
  { key: "status", label: "Status", hint: "Geek team", show: (c) => (PICK_STATUS[c.status] || [c.status])[0] },
  { key: "note", label: "Your note", show: (c) => c.note || "—" },
];

/** /brands/discovery/compare — shortlist (api.brand_discover_picks) ke creators side by side; "Best" = sabse zyada followers / engagement */
export default function DiscoveryCompare() {
  const picks = usePicks();
  const [toast, say] = useToast();
  const [ids, setIds] = useState(null); // pick_id list (pehle 3)
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (ids === null && picks.list.length) setIds(picks.list.slice(0, 3).map((p) => p.pick_id));
  }, [picks.list, ids]);

  const all = picks.list.map((k) => ({ ...k, s0: k.snapshot || {}, name: (k.snapshot && k.snapshot.name) || "@" + k.handle }));
  const cols = (ids || []).map((id) => all.find((x) => x.pick_id === id)).filter(Boolean);
  const others = all.filter((c) => !(ids || []).includes(c.pick_id));
  const top = (f) => (cols.length ? cols.reduce((a, c) => (f(c) > f(a) ? c : a)) : null);
  const mostF = top((c) => Number(c.s0.followers) || 0);
  const mostE = top((c) => Number(c.s0.engagement) || 0);
  const pick = mostE;

  const bestOf = (row) => {
    if (!row.best || cols.length < 2) return null;
    const vals = cols.map(row.val);
    const target = Math.max(...vals);
    return target ? cols[vals.indexOf(target)].pick_id : null;
  };

  if (picks.loading && !picks.list.length) {
    return (
      <BrandShell crumbs={[{ label: "Discovery", href: "/brands/discovery" }, { label: "My shortlist", href: "/brands/discovery/shortlist" }, { label: "Compare" }]}>
        <BrLoading rows={6} />
      </BrandShell>
    );
  }
  if (!picks.list.length) {
    return (
      <BrandShell crumbs={[{ label: "Discovery", href: "/brands/discovery" }, { label: "My shortlist", href: "/brands/discovery/shortlist" }, { label: "Compare" }]}>
        {picks.error ? (
          <BrError error={picks.error} onRetry={picks.reload} />
        ) : (
          <BrEmpty title="Nothing to compare yet" text="Shortlist two or more creators in Discovery to compare them side by side.">
            <Link href="/brands/discovery" className="br-btn br-btn--primary br-btn--sm">
              Find creators
            </Link>
          </BrEmpty>
        )}
      </BrandShell>
    );
  }

  return (
    <BrandShell
      crumbs={[
        { label: "Discovery", href: "/brands/discovery" },
        { label: "My shortlist", href: "/brands/discovery/shortlist" },
        { label: "Compare" },
      ]}
    >
      <title>Compare creators — Geek OS Brand</title>

      <div className="br-head">
        <div>
          <p className="br-eyebrow">Discovery · My shortlist</p>
          <h1 className="br-h1">Compare creators</h1>
          <p className="br-sub">Side by side — followers, engagement and where each one stands. Green marks the best in each row.</p>
        </div>
        <button type="button" className="br-btn br-btn--ghost" onClick={() => window.print()}>
          <Download size={14} /> Download as PDF
        </button>
      </div>

      <p className="dcm-ai">
        <Sparkle size={15} />
        <span>
          {cols.length < 2
            ? "Add one more creator to compare."
            : `${mostF.name} has the most followers (${fmt(mostF.s0.followers || 0)}). ${mostE.name} has the most engaged audience${mostE.s0.engagement != null ? ` (${eng1(mostE.s0.engagement)}%)` : ""}.`}
        </span>
      </p>

      <div className="br-table-wrap dcm-wrap" data-scroll>
        <table className="dcm">
          <thead>
            <tr>
              <th className="dcm-first">
                <strong>Comparing {cols.length} creators</strong>
                <small>from your shortlist</small>
                {cols.length < 4 && others.length > 0 &&
                  (adding ? (
                    <select
                      className="dcm-add__sel"
                      autoFocus
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) setIds([...(ids || []), e.target.value]);
                        setAdding(false);
                      }}
                      onBlur={() => setAdding(false)}
                    >
                      <option value="" disabled>
                        Pick a creator…
                      </option>
                      {others.map((c) => (
                        <option key={c.pick_id} value={c.pick_id}>
                          {c.name} · {c.s0.followers != null ? fmt(c.s0.followers) : "—"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button type="button" className="dcm-add" onClick={() => setAdding(true)}>
                      <Plus size={13} /> Add creator
                    </button>
                  ))}
              </th>
              {cols.map((c) => (
                <th key={c.pick_id} className="dcm-col">
                  {cols.length > 1 && (
                    <button type="button" className="dcm-x" aria-label={`Remove ${c.name}`} onClick={() => setIds(ids.filter((x) => x !== c.pick_id))}>
                      <Close size={12} />
                    </button>
                  )}
                  <BrAvatar name={c.name} src={c.s0.profile_picture_url} cls="br-av--lg" />
                  <a href={igUrl(c.handle)} target="_blank" rel="noreferrer" className="dcm-name">
                    {c.name} <Check size={12} />
                  </a>
                  <small>
                    @{c.handle}
                    {c.s0.city ? ` · ${c.s0.city}` : ""}
                  </small>
                  {pick?.pick_id === c.pick_id && cols.length > 1 && (
                    <span className="dcm-pick">
                      <Sparkle size={11} /> Most engaged audience
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const best = bestOf(row);
              return (
                <tr key={row.key}>
                  <td className="dcm-first">
                    <strong>{row.label}</strong>
                    {row.hint && <small>{row.hint}</small>}
                  </td>
                  {cols.map((c) => (
                    <td key={c.pick_id} className={best === c.pick_id ? "is-best" : ""}>
                      <span className="dcm-val">
                        {row.show(c)}
                        {best === c.pick_id && <em>Best</em>}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="dcm-foot">
              <td className="dcm-first">
                <small>Pick one or more</small>
              </td>
              {cols.map((c) => (
                <td key={c.pick_id}>
                  <div className="dcm-btns">
                    <button type="button" className="br-btn br-btn--sm br-btn--primary" onClick={() => say(`@${c.handle} is already on your shortlist`)}>
                      <Check size={13} /> Shortlisted
                    </button>
                    <button type="button" className="br-btn br-btn--sm br-btn--soft" onClick={() => say("Shortlisted creators go to the Geek team — saving them separately is coming soon")}>
                      <Bookmark size={13} /> Save
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {toast}

      <style>{`
        .dcm-ai {
          display: flex; gap: 10px; align-items: flex-start; margin: 0 0 18px; padding: 14px 16px; border-radius: 14px;
          background: var(--br-lilac); color: var(--br-text); font-size: 13px; line-height: 1.55;
        }
        .dcm-ai svg { flex-shrink: 0; margin-top: 2px; color: var(--br-primary); }

        .dcm { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 13.5px; }
        .dcm th, .dcm td { padding: 13px 16px; text-align: left; vertical-align: middle; border-bottom: 1px solid var(--br-border); }
        .dcm thead th { background: linear-gradient(180deg, #fff 0%, #f6f3ff 100%); vertical-align: top; }
        .dcm tbody tr:nth-child(even) td { background: #fafafd; }
        .dcm tr:last-child td { border-bottom: 0; }
        .dcm-first { width: 210px; position: sticky; left: 0; z-index: 1; background: #fff; }
        .dcm thead .dcm-first { background: #fbfaff; }
        .dcm tbody tr:nth-child(even) .dcm-first { background: #fafafd; }
        .dcm-first strong { display: block; font-size: 13px; font-weight: 700; }
        .dcm-first small { display: block; margin-top: 2px; font-size: 11px; color: var(--br-faint); font-weight: 400; }
        thead .dcm-first strong { font-size: 14.5px; font-weight: 800; }
        .dcm-add, .dcm-add__sel {
          display: inline-flex; align-items: center; gap: 6px; height: 32px; margin-top: 14px; padding: 0 12px;
          border: 1px solid var(--br-border-2); border-radius: 999px; background: #fff; font-size: 12.5px; font-weight: 600; color: var(--br-ink);
        }
        .dcm-add__sel { max-width: 180px; outline: none; }
        .dcm-col { position: relative; font-weight: 400; width: 26%; }
        .dcm-col .br-av { margin-bottom: 10px; }
        .dcm-x {
          position: absolute; top: 12px; right: 14px; width: 24px; height: 24px; border-radius: 50%;
          border: 0; background: #eceef5; color: var(--br-muted); display: grid; place-items: center;
        }
        .dcm-x:hover { background: var(--br-red-bg); color: var(--br-red); }
        .dcm-name { display: inline-flex; align-items: center; gap: 5px; font-size: 15px; font-weight: 800; }
        .dcm-name svg { color: var(--br-blue); }
        .dcm-col small { display: block; margin-top: 2px; font-size: 11.5px; color: var(--br-muted); }
        .dcm-pick {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; padding: 4px 10px; border-radius: 999px;
          background: linear-gradient(135deg, #7c5cff, #b84dff); color: #fff; font-size: 11px; font-weight: 700;
        }
        .dcm-val { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
        .is-best .dcm-val { color: var(--br-green); }
        .dcm-val em { font-style: normal; padding: 2px 7px; border-radius: 6px; background: var(--br-green-bg); color: var(--br-green); font-size: 10.5px; font-weight: 700; }
        .dcm-bar { display: block; width: 150px; max-width: 100%; height: 6px; margin-top: 7px; border-radius: 999px; background: #eceef5; overflow: hidden; }
        .dcm-bar i { display: block; height: 100%; border-radius: inherit; }
        .dcm-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .dcm-btns .is-saved { background: var(--br-primary); color: #fff; }

        @media (max-width: 640px) {
          .dcm-first { width: 140px; min-width: 140px; }
          .dcm th, .dcm td { padding: 12px; }
          .dcm-ai { font-size: 12.5px; }
        }
      `}</style>
    </BrandShell>
  );
}
