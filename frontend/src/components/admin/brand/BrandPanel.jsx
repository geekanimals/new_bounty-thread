"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import BrandCrm from "@/components/admin/brand/BrandCrm";
import Drawer from "@/components/admin/brand/Drawer";
import { brandInfo } from "@/components/admin/brand/store";
import { initials } from "@/components/admin/data";

/** notes ki ginti (notes page localStorage mein rakhta hai) */
export const notesKey = (id) => `geek_admin_brand_notes_${id}`;

/**
 * Brand detail = Brand CRM ke upar right panel (Figma 065–070).
 * Har tab apna route: /admin/brands/[id]/{overview,campaigns,creators,notes,logins,billing}
 */
export default function BrandPanel({ id, children, logins }) {
  const pathname = usePathname() || "";
  const [b, setB] = useState(() => brandInfo(id));
  const [notes, setNotes] = useState(0);

  useEffect(() => {
    const sync = () => {
      setB(brandInfo(id));
      try {
        setNotes(JSON.parse(window.localStorage.getItem(notesKey(id)) || "[]").length);
      } catch {
        setNotes(0);
      }
    };
    sync();
    window.addEventListener("geek-brands", sync);
    return () => window.removeEventListener("geek-brands", sync);
  }, [id]);

  const base = `/admin/brands/${id}`;
  const seg = pathname.split("/")[4] || "overview";
  const tabs = [
    { k: "overview", label: "Overview" },
    { k: "campaigns", label: `Campaigns (${b.campaigns})` },
    { k: "creators", label: `Creators (${b.creators})` },
    { k: "notes", label: `Notes & tasks (${notes})` },
    { k: "logins", label: `Logins (${logins ?? (b.login ? 1 : 0)})` },
    { k: "logins#portal", label: "🏢 Brand portal", portal: true },
    { k: "billing", label: "💳 Billing" },
  ];

  return (
    <AdminShell>
      <BrandCrm interactive={false} />
      <Drawer closeHref="/admin/brands" label={`${b.name} brand`}>
        <div className="bp-head">
          <span className="bp-av">{b.name.trim().includes(" ") ? initials(b.name) : b.name.slice(0, 2).toUpperCase()}</span>
          <div className="bp-head__txt">
            <p className="bp-eye">Brand</p>
            <h2>{b.name}</h2>
            <span className={`ad-badge ${b.status === "Active client" ? "ad-badge--green" : "ad-badge--orange"}`}>{b.status}</span>
          </div>
          <div className="bp-head__act">
            <Link href="/admin/campaigns/new" className="ad-btn ad-btn--ghost">
              ➕ Campaign
            </Link>
            <Link href="/admin/creator-upload" className="ad-btn ad-btn--ghost">
              📥 Upload creators
            </Link>
          </div>
        </div>

        <div className="bp-stats">
          {[
            [b.campaigns, "Campaigns"],
            [b.creators, "Creators"],
            [b.posted, "Posted"],
            [b.value, "Product value"],
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

        <div className="bp-body">{children}</div>
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
