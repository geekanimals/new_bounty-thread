"use client";

import { useEffect, useState } from "react";
import { ToneIcon } from "@/components/brands/BrandShell";
import CampaignFrame from "@/components/brands/CampaignFrame";
import { BrLoading, BrError } from "@/components/brands/BrandStates";
import { useTrackReport, bAv, bInitials, bNum, bShort, bInr } from "@/services/brand";
import { Info, Copy, Check, ChevronDown } from "@/components/ui/Icons";

/**
 * /brands/campaigns/[id]/links — har creator ka link + code aur usse kitni sale hui
 * (tracking.js mount readOnly: api.track_report — links, daily, sales; brand ke liye sirf dekhna).
 */
export default function CampaignLinks() {
  return (
    <>
      <CampaignFrame tab="Links & sales">{(d, c) => <LinksTab id={c.id} />}</CampaignFrame>

      <style>{`
        .cl-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .cl-info {
          display: flex; align-items: center; gap: 8px; margin: 16px 0;
          padding: 11px 14px; border-radius: 11px; background: var(--br-blue-bg); color: var(--br-blue);
          font-size: 12.5px; font-weight: 500; line-height: 1.5;
        }
        .cl-info svg { flex-shrink: 0; }
        .cl-link { display: block; font-weight: 700; color: var(--br-primary); }
        .cl-link:hover { text-decoration: underline; }
        .cl-code { display: block; font-size: 11.5px; color: var(--br-muted); }
        .cl-sales { font-weight: 800; color: var(--br-green); }
        .cl-copy { min-width: 86px; }
        .cl-copy.is-done { border-color: var(--br-green); color: var(--br-green); }
        .cl-more { padding: 4px 0 16px; margin-top: 12px; }

        @media (max-width: 1100px) { .cl-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .cl-stats { gap: 10px; }
          .cl-stats .br-stat:first-child { grid-column: 1 / -1; }
          .cl-info { align-items: flex-start; }
        }
              .cl-none { padding: 18px !important; text-align: center; color: var(--br-muted); font-size: 13px; }
`}</style>
    </>
  );
}

function LinksTab({ id }) {
  const r = useTrackReport(id);
  const [shown, setShown] = useState(6);
  const [copied, setCopied] = useState("");
  const [base, setBase] = useState(""); // link ka domain — browser mein (tracking.js base())
  useEffect(() => setBase(window.location.origin.replace(/\/+$/, "")), []);

  if (r.loading && !r.data) return <BrLoading rows={5} />;
  if (r.error) return <BrError error={r.error.message} onRetry={() => r.reload()} />;

  const d = r.data || {};
  const cfg = d.config || {};
  const on = cfg.enabled === true || cfg.enabled === "true";
  const mode = cfg.mode || "none";
  const L = [...(d.links || [])].sort((a, b) => (+b.clicks || 0) - (+a.clicks || 0));
  const T = L.reduce(
    (a, x) => {
      a.clicks += +x.clicks || 0;
      a.unique += +x.unique || 0;
      a.shop += +x.shop || 0;
      a.orders += +x.orders || 0;
      a.sales += +x.sales || 0;
      return a;
    },
    { clicks: 0, unique: 0, shop: 0, orders: 0, sales: 0 }
  );
  const notSplit = (d.sales || []).filter((s) => !s.handle);
  const orders = T.orders + notSplit.reduce((a, s) => a + (+s.orders || 0), 0);
  const sales = T.sales + notSplit.reduce((a, s) => a + (+s.amount || 0), 0);
  const STATS = [
    { label: "Link clicks", value: bShort(T.clicks), note: `${bNum(T.unique)} unique people`, icon: "link", dark: true },
    { label: "Orders", value: bNum(orders), note: "tracked by code + link", icon: "package", tone: "blue" },
    { label: "Sales", value: bInr(sales), note: orders && T.unique ? `conversion ${Math.round((1000 * orders) / T.unique) / 10}%` : "from your order data", icon: "wallet", tone: "green" },
    { label: "Went to the shop", value: bNum(T.shop), note: `${L.length} creators with a link`, icon: "trend", tone: "orange" },
  ];
  const linkOf = (slug) => `${base}/go/${slug}`;
  const codeOf = (x) => (mode === "none" && !x.own_code ? "" : x.code || "");

  const copy = (x) => {
    const code = codeOf(x);
    const text = linkOf(x.slug) + (code ? ` · Code ${code}` : "");
    setCopied(x.link_id);
    setTimeout(() => setCopied(""), 2000);
    try {
      navigator.clipboard?.writeText(text).catch(() => {});
    } catch {
      // clipboard na mile (http / purana browser) to bhi UI chale
    }
  };

  return (
    <>
      <div className="cl-stats">
        {STATS.map((s) => (
          <div key={s.label} className={`br-stat ${s.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={s.icon} tone={s.dark ? "dark" : s.tone} size={30} />
              {s.label}
            </p>
            <p className="br-stat__value">{s.value}</p>
            <p className="br-stat__note">{s.note}</p>
          </div>
        ))}
      </div>

      <p className="cl-info">
        <Info size={14} />
        {on
          ? `Each creator gets their own short link${mode !== "none" ? " and promo code" : ""}. Sales come from your store’s order data, matched by code.${cfg.discount ? ` Offer: ${cfg.discount}.` : ""}`
          : "Tracking is off for this campaign — the Geek team can switch it on. Links below are ready either way."}
      </p>

      <div className="br-table-wrap">
        <table className="br-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Link / code</th>
              <th>Clicks</th>
              <th>Orders</th>
              <th>Sales</th>
              <th>Conv.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {L.slice(0, shown).map((x) => {
              const name = x.handle ? `@${x.handle}` : x.name || "Creator";
              const code = codeOf(x);
              return (
                <tr key={x.link_id}>
                  <td>
                    <span className="br-who">
                      <span className="br-av br-av--sm" style={{ background: bAv(x.handle || x.name) }}>
                        {bInitials(x.name || x.handle)}
                      </span>
                      <span>
                        <strong>{x.name || name}</strong>
                        <small>{[x.handle ? `@${x.handle}` : "", x.kind === "geek" ? "On Geek OS" : "Sheet"].filter(Boolean).join(" · ")}</small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <a href={linkOf(x.slug)} target="_blank" rel="noopener noreferrer" className="cl-link">
                      {linkOf(x.slug).replace(/^https?:\/\//, "")}
                    </a>
                    <small className="cl-code">{code ? `Code ${code}` : "No code yet"}</small>
                  </td>
                  <td>
                    <strong>{bNum(x.clicks)}</strong>
                  </td>
                  <td>{bNum(x.orders)}</td>
                  <td className="cl-sales">{+x.sales ? bInr(x.sales) : "—"}</td>
                  <td>{+x.orders && +x.unique ? `${Math.round((1000 * x.orders) / x.unique) / 10}%` : "—"}</td>
                  <td>
                    <button type="button" className={`br-btn br-btn--ghost br-btn--sm cl-copy ${copied === x.link_id ? "is-done" : ""}`} onClick={() => copy(x)}>
                      {copied === x.link_id ? <Check size={13} /> : <Copy size={13} />}
                      {copied === x.link_id ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {L.length === 0 && (
              <tr>
                <td colSpan={7} className="cl-none">
                  No creators on this campaign yet — every creator added gets a link automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {L.length > shown && (
          <div className="br-more cl-more">
            <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 6)}>
              Load more <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>

      {copied && (
        <div className="br-toast" role="status">
          <Check size={14} /> Copied link{codeOf(L.find((x) => x.link_id === copied) || {}) ? " + code" : ""}
        </div>
      )}
    </>
  );
}
