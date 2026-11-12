"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHead, Stats } from "@/components/admin/ui";
import { BRANDS } from "@/components/admin/data";
import PTable from "@/components/admin/brand/PTable";
import { getAdded, liveBrands, setAdded } from "@/components/admin/brand/store";

/**
 * Brand CRM ka main view (Figma 056). /admin/brands par aur brand panel ke peeche dono jagah.
 * interactive=false → sirf peeche dikhane ke liye (panel khula ho tab).
 */
export default function BrandCrm({ interactive = true }) {
  const [list, setList] = useState(BRANDS);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", category: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sync = () => setList(liveBrands());
    sync();
    window.addEventListener("geek-brands", sync);
    return () => window.removeEventListener("geek-brands", sync);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const shown = list.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  const live = list.filter((b) => b.live !== "0 live").length;

  const add = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `brand-${list.length + 1}`;
    if (list.some((b) => b.id === id)) return setToast(`${name} is already in the CRM`);
    setAdded([...getAdded(), { id, name, campaigns: 0, live: "0 live", creators: 0, posts: 0, login: false, website: form.website.trim() || "—", category: form.category.trim() || "—" }]);
    setForm({ name: "", website: "", category: "" });
    setAdding(false);
    setToast(`${name} added to the CRM`);
  };

  return (
    <div className="bc" aria-hidden={!interactive || undefined}>
      <PageHead title="Brand CRM" sub="Relationship history, campaigns, creator activity and workspace access.">
        <Link href="/admin/brands/deleted" className="bc-del" tabIndex={interactive ? 0 : -1}>
          🗑️ Deleted brands
        </Link>
        <button type="button" className="ad-btn ad-btn--primary" onClick={() => setAdding(!adding)} tabIndex={interactive ? 0 : -1}>
          ＋ Add brand
        </button>
      </PageHead>

      <Stats
        items={[
          { value: list.length, label: "Brands in CRM", note: "Including one test account" },
          { value: 8, label: "All brand campaigns", href: "/admin/campaigns" },
          { value: live > 5 ? 5 : live, label: "Live now", note: "Running promotions", href: "/admin/campaigns/live" },
          { value: 151, label: "Creators approved", note: "Cross-campaign", href: "/admin/creators" },
          { value: 63, label: "Posts live", note: "Publishing history", href: "/admin/reports" },
        ]}
      />

      {adding && interactive && (
        <form className="ad-card bc-add" onSubmit={add}>
          <h2 className="ad-h2">Add a brand</h2>
          <div className="bc-add__grid">
            <div>
              <label className="ad-label" htmlFor="bc-name">
                Brand name
              </label>
              <input id="bc-name" className="ad-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mamaearth" autoFocus />
            </div>
            <div>
              <label className="ad-label" htmlFor="bc-web">
                Website
              </label>
              <input id="bc-web" className="ad-input" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="brand.in" />
            </div>
            <div>
              <label className="ad-label" htmlFor="bc-cat">
                Category
              </label>
              <input id="bc-cat" className="ad-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Beauty" />
            </div>
          </div>
          <div className="bc-add__act">
            <button type="submit" className="ad-btn ad-btn--primary" disabled={!form.name.trim()}>
              Add brand
            </button>
            <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="ad-card bc-card">
        <div className="bc-card__head">
          <h2 className="ad-h2">Brands</h2>
          <input className="ad-input bc-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand…" aria-label="Search brand" tabIndex={interactive ? 0 : -1} />
        </div>
        <PTable
          minW={720}
          cols={[
            { label: "Brand", w: "27%" },
            { label: "Campaigns", w: "14.6%" },
            { label: "Live", w: "8.7%" },
            { label: "Creators", w: "13.2%" },
            { label: "Posts", w: "9.5%" },
            { label: "Access", w: "16%" },
            { label: "", w: "11%" },
          ]}
          rows={shown.map((b) => [
            <b key="n">{b.name}</b>,
            b.campaigns,
            b.live,
            b.creators,
            b.posts,
            <span key="a" className={`ad-badge ${b.login ? "ad-badge--green" : ""}`}>
              {b.login ? "Brand login" : "No login"}
            </span>,
            <Link key="o" href={`/admin/brands/${b.id}/overview`} className="pt-link" tabIndex={interactive ? 0 : -1}>
              Open →
            </Link>,
          ])}
          empty={`No brand matches “${q}”`}
        />
      </section>

      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .bc-del { display: inline-flex; align-items: center; height: 42px; padding: 0 6px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .bc-del:hover { color: var(--ad-primary-2); }
        .bc-card { padding: 22px 22px 22px; }
        .bc-card__head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
        .bc-search { width: 173px; height: 42px; }
        .bc-card .pt td:first-child, .bc-card .pt th:first-child { padding-left: 11px; }
        .bc-add { padding: 22px; margin-bottom: 20px; }
        .bc-add__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
        .bc-add__act { display: flex; gap: 10px; margin-top: 16px; }
        @media (max-width: 640px) {
          .bc-card { padding: 18px 16px; }
          .bc-card__head { flex-wrap: wrap; margin-bottom: 14px; }
          .bc-search { width: 100%; }
          .bc-add__grid { grid-template-columns: 1fr; }
          .bc-del { justify-content: center; border-radius: 11px; background: #fff; border: 1px solid var(--ad-line-2); }
        }
      `}</style>
    </div>
  );
}
