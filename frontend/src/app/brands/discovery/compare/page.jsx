"use client";

import { useState } from "react";
import Link from "next/link";
import BrandShell from "@/components/brands/BrandShell";
import { CREATORS, MATCHES, getCreator } from "@/components/brands/data";
import { Download, Sparkle, Close, Plus, Check, Bookmark } from "@/components/ui/Icons";

// Match score — is campaign ke liye Geek ka score
const MATCH = { "aisha-khan": 94, "meera-iyer": 91, "pooja-nair": 86 };
const matchOf = (id) => MATCH[id] ?? MATCHES.find((m) => m.id === id)?.score ?? 72;

const num = (s) => {
  const n = parseFloat(String(s).replace(/[^\d.]/g, "")) || 0;
  return /M/i.test(s) ? n * 1e6 : /K/i.test(s) ? n * 1000 : n;
};
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

// Har row: value nikaalna + "best" kaun (max ya min)
const ROWS = [
  { key: "followers", label: "Followers", val: (c) => num(c.followers), show: (c) => c.followers, best: "max" },
  { key: "eng", label: "Engagement", hint: "likes + comments + saves", val: (c) => parseFloat(c.eng), show: (c) => c.eng, best: "max" },
  { key: "views", label: "Avg reel views", hint: "last 10 reels", val: (c) => num(c.avgViews), show: (c) => c.avgViews, best: "max" },
  { key: "women", label: "Audience: women", val: (c) => c.womenNum, show: (c) => `${c.womenNum}%`, bar: "#e8336d", best: "max" },
  { key: "age", label: "Audience: age 25–34", hint: "your target group", val: (c) => c.age2534, show: (c) => `${c.age2534}%`, bar: "#8b5cf6", best: "max" },
  { key: "cities", label: "Top cities", show: (c) => c.topCities },
  { key: "fee", label: "Fee", hint: "1 Reel + 2 Stories", val: (c) => num(c.fee), show: (c) => c.feeFull, best: "min" },
  { key: "cpv", label: "Cost per 1K views", hint: "fee ÷ avg views", val: (c) => num(c.fee) / (num(c.avgViews) / 1000), show: (c) => inr(num(c.fee) / (num(c.avgViews) / 1000)), best: "min" },
  { key: "worked", label: "Worked with Nykaa", worked: true },
  { key: "match", label: "Match for the brief", hint: "Geek’s score", val: (c) => matchOf(c.id), show: (c) => matchOf(c.id), best: "max" },
];

/** /brands/discovery/compare — shortlist ke creators side by side */
export default function DiscoveryCompare() {
  const [ids, setIds] = useState(["aisha-khan", "meera-iyer", "pooja-nair"]);
  const [adding, setAdding] = useState(false);
  const [short, setShort] = useState(["aisha-khan"]);
  const [saved, setSaved] = useState([]);
  const [toast, setToast] = useState("");

  const cols = ids.map(getCreator);
  const others = CREATORS.filter((c) => !ids.includes(c.id));
  const pick = cols.length ? cols.reduce((a, b) => (matchOf(b.id) > matchOf(a.id) ? b : a)) : null;

  const bestOf = (row) => {
    if (!row.best || cols.length < 2) return null;
    const vals = cols.map(row.val);
    const target = row.best === "max" ? Math.max(...vals) : Math.min(...vals);
    return cols[vals.indexOf(target)].id;
  };
  const toggle = (arr, set, id) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

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
          <p className="br-sub">Side by side — audience, engagement and fee. Green marks the best in each row.</p>
        </div>
        <button type="button" className="br-btn br-btn--ghost" onClick={() => flash("Comparison PDF is downloading…")}>
          <Download size={14} /> Download as PDF
        </button>
      </div>

      <p className="dcm-ai">
        <Sparkle size={15} />
        <span>
          Aisha reaches the most 25–34 women. Pooja gives the cheapest views and the most engaged audience. Meera is the safe pick — she already did 2.1M
          views for Nykaa.
        </span>
      </p>

      <div className="br-table-wrap dcm-wrap" data-scroll>
        <table className="dcm">
          <thead>
            <tr>
              <th className="dcm-first">
                <strong>Comparing {cols.length} creators</strong>
                <small>for Wedding Season Looks</small>
                {cols.length < 4 &&
                  (adding ? (
                    <select
                      className="dcm-add__sel"
                      autoFocus
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) setIds([...ids, e.target.value]);
                        setAdding(false);
                      }}
                      onBlur={() => setAdding(false)}
                    >
                      <option value="" disabled>
                        Pick a creator…
                      </option>
                      {others.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.followers}
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
                <th key={c.id} className="dcm-col">
                  {cols.length > 1 && (
                    <button type="button" className="dcm-x" aria-label={`Remove ${c.name}`} onClick={() => setIds(ids.filter((x) => x !== c.id))}>
                      <Close size={12} />
                    </button>
                  )}
                  <span className="br-av br-av--lg" style={{ background: c.av }}>
                    {c.initials}
                  </span>
                  <Link href={`/brands/creators/${c.id}`} className="dcm-name">
                    {c.name} <Check size={12} />
                  </Link>
                  <small>
                    {c.handle} · {c.city}
                  </small>
                  {pick?.id === c.id && cols.length > 1 && (
                    <span className="dcm-pick">
                      <Sparkle size={11} /> Geek’s pick for this campaign
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
                    <td key={c.id} className={best === c.id ? "is-best" : ""}>
                      {row.worked ? (
                        c.workedNykaa ? (
                          <span className="br-badge br-badge--green">{c.workedNykaa}</span>
                        ) : (
                          <span className="br-badge br-badge--grey">No</span>
                        )
                      ) : (
                        <>
                          <span className="dcm-val">
                            {row.show(c)}
                            {best === c.id && <em>Best</em>}
                          </span>
                          {row.bar && (
                            <span className="dcm-bar">
                              <i style={{ width: `${row.val(c)}%`, background: row.bar }} />
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="dcm-foot">
              <td className="dcm-first">
                <small>Pick one or more</small>
              </td>
              {cols.map((c) => {
                const sl = short.includes(c.id);
                const sv = saved.includes(c.id);
                return (
                  <td key={c.id}>
                    <div className="dcm-btns">
                      <button type="button" className={`br-btn br-btn--sm ${sl ? "br-btn--primary" : "br-btn--ghost"}`} onClick={() => toggle(short, setShort, c.id)}>
                        {sl ? <Check size={13} /> : <Plus size={13} />} {sl ? "Shortlisted" : "Shortlist"}
                      </button>
                      <button type="button" className={`br-btn br-btn--sm br-btn--soft ${sv ? "is-saved" : ""}`} onClick={() => toggle(saved, setSaved, c.id)}>
                        <Bookmark size={13} /> {sv ? "Saved" : "Save"}
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

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
