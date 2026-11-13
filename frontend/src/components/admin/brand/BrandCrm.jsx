"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHead, Stats } from "@/components/admin/ui";
import PTable from "@/components/admin/brand/PTable";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { num, useToast } from "@/components/admin/brand/util";

/**
 * Brand CRM ka main view (Figma 056). /admin/brands par aur brand panel ke peeche dono jagah.
 * Data: api.brand_list (purane app jaisa). Add brand → api.brand_save.
 * interactive=false → sirf peeche dikhane ke liye (panel khula ho tab).
 */
export default function BrandCrm({ interactive = true }) {
  const router = useRouter();
  const { data, error, loading, reload } = useRpc("admin", "api.brand_list", { p_q: null });
  const list = Array.isArray(data) ? data : [];
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", website: "", category: "" });
  const [toast, say] = useToast();

  const qq = q.trim().toLowerCase();
  const shown = list.filter((b) => !qq || [b.name, b.category, b.website, b.instagram].join(" ").toLowerCase().includes(qq));
  const sum = (k) => list.reduce((s, b) => s + (Number(b[k]) || 0), 0);
  const withLogin = list.filter((b) => Number(b.logins) > 0).length;

  const add = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || busy) return;
    setBusy(true);
    const p = { name, website: form.website.trim(), category: form.category.trim(), status: "active" };
    const r = await rpc("admin", "api.brand_save", { p });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    setForm({ name: "", website: "", category: "" });
    setAdding(false);
    say(`${name} added to the CRM`);
    reload(true);
    if (r.data?.brand_id) router.push(`/admin/brands/${r.data.brand_id}/overview`);
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
          { value: loading ? "—" : list.length, label: "Brands in CRM", note: `${withLogin} with a brand login` },
          { value: loading ? "—" : sum("campaigns"), label: "All brand campaigns", href: "/admin/campaigns" },
          { value: loading ? "—" : sum("active"), label: "Live now", note: "Running promotions", href: "/admin/campaigns/live" },
          { value: loading ? "—" : sum("creators"), label: "Creators approved", note: "Cross-campaign", href: "/admin/creators" },
          { value: loading ? "—" : sum("posted"), label: "Posts live", note: "Publishing history", href: "/admin/reports" },
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
            <button type="submit" className="ad-btn ad-btn--primary" disabled={!form.name.trim() || busy}>
              {busy ? "Adding…" : "Add brand"}
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
        {loading || error ? (
          <p className={`bc-state ${error ? "is-err" : ""}`}>
            {loading ? "Loading brands…" : `Couldn’t load brands: ${errText(error)}`}{" "}
            {error && (
              <button type="button" onClick={() => reload()}>
                Retry
              </button>
            )}
          </p>
        ) : (
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
            <b key="n" title={b.name}>{b.name}</b>,
            num(b.campaigns),
            `${num(b.active)} live`,
            num(b.creators),
            num(b.posted),
            <span key="a" className={`ad-badge ${Number(b.logins) > 0 ? "ad-badge--green" : ""}`}>
              {Number(b.logins) > 0 ? (Number(b.logins) > 1 ? `${b.logins} brand logins` : "Brand login") : "No login"}
            </span>,
            <Link key="o" href={`/admin/brands/${b.brand_id}/overview`} className="pt-link" tabIndex={interactive ? 0 : -1}>
              Open →
            </Link>,
          ])}
          empty={q ? `No brand matches “${q}”` : "No brands yet — ＋ Add brand, or create a campaign (its brand is added here)."}
        />
        )}
      </section>

      {toast && interactive && <div className="ad-toast">{toast}</div>}

      <style>{`
        .bc-del { display: inline-flex; align-items: center; height: 42px; padding: 0 6px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .bc-del:hover { color: var(--ad-primary-2); }
        .bc-card { padding: 22px 22px 22px; }
        .bc-card__head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
        .bc-search { width: 173px; height: 42px; }
        .bc-card .pt td:first-child, .bc-card .pt th:first-child { padding-left: 11px; }
        .bc-add { padding: 22px; margin-bottom: 20px; }
        .bc-state { padding: 18px 11px; font-size: 13px; color: var(--ad-muted); }
        .bc-state.is-err { color: var(--ad-red); }
        .bc-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
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
