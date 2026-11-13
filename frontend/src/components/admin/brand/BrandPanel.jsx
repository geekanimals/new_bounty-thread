"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import BrandCrm from "@/components/admin/brand/BrandCrm";
import Drawer from "@/components/admin/brand/Drawer";
import { useRpc, errText } from "@/lib/supabase";
import { inr, ini, num } from "@/components/admin/brand/util";

/* Brand detail (api.brand_detail) ek baar load — saare tabs isi se padhte hain */
const BrandCtx = createContext(null);
/** Tab ke andar: const { d, b, reload } = useBrand(); */
export const useBrand = () => useContext(BrandCtx);

export const STATUS = { active: "Active client", lead: "Lead", paused: "Paused", archived: "Archived" };

/**
 * Brand detail = Brand CRM ke upar right panel (Figma 065–070).
 * Har tab apna route: /admin/brands/[id]/{overview,campaigns,creators,notes,logins,billing}
 * children = JSX ya function ({ d, b, reload }) => JSX
 */
export default function BrandPanel({ id, children }) {
  const pathname = usePathname() || "";
  const { data: d, error, loading, reload } = useRpc("admin", "api.brand_detail", { p_brand: id }, { skip: !id || id === "sample" });
  const b = d?.brand || {};
  const T = d?.totals || {};
  const ctx = d ? { d, b, reload } : null;

  const base = `/admin/brands/${id}`;
  const seg = pathname.split("/")[4] || "overview";
  const n = (k) => (d ? (d[k] || []).length : "…");
  const tabs = [
    { k: "overview", label: "Overview" },
    { k: "campaigns", label: `Campaigns (${n("campaigns")})` },
    { k: "creators", label: `Creators (${n("creators")})` },
    { k: "notes", label: `Notes & tasks (${n("notes")})` },
    { k: "logins", label: `Logins (${n("logins")})` },
    { k: "logins#portal", label: "🏢 Brand portal", portal: true },
    { k: "billing", label: "💳 Billing" },
  ];
  const name = b.name || (loading ? "Loading…" : "Brand");
  const value = Number(T.spend) ? inr(T.spend) : Number(T.product_value) ? inr(T.product_value) : "—";

  return (
    <AdminShell>
      <BrandCrm interactive={false} />
      <Drawer closeHref="/admin/brands" label={`${name} brand`}>
        <div className="bp-head">
          {b.logo_url ? (
            <img className="bp-av" src={b.logo_url} alt="" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
          ) : (
            <span className="bp-av">{ini(b.name || "?")}</span>
          )}
          <div className="bp-head__txt">
            <p className="bp-eye">Brand</p>
            <h2>{name}</h2>
            {d && <span className={`ad-badge ${(b.status || "active") === "active" ? "ad-badge--green" : "ad-badge--orange"}`}>{STATUS[b.status] || "Active client"}</span>}
          </div>
          <div className="bp-head__act">
            <Link href={`/admin/campaigns/new${b.name ? `?brand=${encodeURIComponent(b.name)}` : ""}`} className="ad-btn ad-btn--ghost">
              ➕ Campaign
            </Link>
            <Link href={`/admin/creator-upload${id ? `?brand=${id}` : ""}`} className="ad-btn ad-btn--ghost">
              📥 Upload creators
            </Link>
          </div>
        </div>

        <div className="bp-stats">
          {[
            [d ? num(T.campaigns) : "—", "Campaigns"],
            [d ? num(T.creators) : "—", "Creators"],
            [d ? num(T.posted) : "—", "Posted"],
            [d ? value : "—", Number(T.spend) ? "Budget" : "Product value"],
          ].map(([n, l]) => (
            <div key={l}>
              <strong>{n}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>

        <nav className="bp-tabs" aria-label="Brand sections">
          {tabs.map((t) => (
            <Link key={t.k} href={`${base}/${t.k}`} className={`ad-tab ${!t.portal && seg === t.k ? "is-on" : ""}`}>
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="bp-body">
          {loading && !d ? (
            <p className="bp-state">Loading…</p>
          ) : error ? (
            <p className="bp-state is-err">
              Couldn’t open the brand: {errText(error)}{" "}
              <button type="button" onClick={() => reload()}>
                Retry
              </button>
            </p>
          ) : ctx ? (
            <BrandCtx.Provider value={ctx}>{typeof children === "function" ? children(ctx) : children}</BrandCtx.Provider>
          ) : null}
        </div>
      </Drawer>

      <style>{`
        .bp-head { display: flex; align-items: flex-start; gap: 14px; padding-right: 46px; }
        .bp-av { width: 52px; height: 52px; flex-shrink: 0; margin-top: 15px; border-radius: 13px; display: grid; place-items: center; background: var(--ad-lilac-2); color: var(--ad-primary); font-size: 14px; font-weight: 800; }
        .bp-head__txt { flex: 1; min-width: 0; }
        .bp-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .bp-head h2 { margin-top: 5px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; line-height: 1.3; }
        .bp-head__txt .ad-badge { margin-top: 4px; height: 26px; }
        .bp-head__act { display: flex; gap: 8px; margin-top: 21px; flex-wrap: wrap; justify-content: flex-end; }
        .bp-head__act .ad-btn { height: 41px; padding: 0 15px; border-color: var(--ad-line-2); }

        .bp-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; margin-top: 2px; }
        .bp-stats div { display: flex; flex-direction: column; padding: 18px 16px 16px; border-radius: 13px; background: var(--ad-soft-2); }
        .bp-stats strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.15; color: var(--ad-ink); }
        .bp-stats span { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }

        .bp-tabs { display: flex; flex-wrap: wrap; gap: 8px 7px; margin-top: 12px; }
        .bp-tabs .ad-tab { height: 37px; }
        .bp-tabs .ad-tab:not(.is-on) { color: #67718a; }
        .bp-body { margin-top: 34px; }
        .bp-state { font-size: 13px; color: var(--ad-muted); }
        .bp-state.is-err { color: var(--ad-red); }
        .bp-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        img.bp-av { object-fit: cover; background: #fff; border: 1px solid var(--ad-line); }

        /* tabs ke andar common bits */
        .bp-sec { padding-bottom: 18px; border-bottom: 1px solid var(--ad-line); }
        .bp-sec + .bp-sec { margin-top: 22px; }
        .bp-sec__t { font-size: 13px; font-weight: 700; color: var(--ad-ink); }
        .bp-sec__s { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .bp-btns { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 16px; }
        .bp-btns .ad-btn { height: 41px; padding: 0 15px; }
        .bp-btns .ad-btn--ghost { border-color: var(--ad-line-2); }
        .bp-plain { height: 41px; padding: 0 15px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .bp-plain:hover { color: var(--ad-primary-2); }

        @media (max-width: 760px) {
          .bp-head { flex-wrap: wrap; padding-right: 40px; }
          .bp-av { margin-top: 4px; }
          .bp-head__act { width: 100%; justify-content: flex-start; margin-top: 4px; }
          .bp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 16px; }
          .bp-body { margin-top: 24px; }
        }
        @media (max-width: 640px) {
          .bp-head__act .ad-btn { flex: 1; }
          .bp-tabs { flex-wrap: nowrap; overflow-x: auto; margin: 12px -16px 0; padding: 0 16px; scrollbar-width: none; }
          .bp-tabs::-webkit-scrollbar { display: none; }
          .bp-tabs .ad-tab { flex-shrink: 0; }
        }
      `}</style>
    </AdminShell>
  );
}
