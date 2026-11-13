"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import PTable from "@/components/admin/brand/PTable";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { fmtDate, num, useToast } from "@/components/admin/brand/util";

/** /admin/brands/deleted — Deleted brands (Figma 057). Data: admin_brands_deleted · Restore: admin_brand_restore */
export default function DeletedBrands() {
  const { data, error, loading, reload } = useRpc("admin", "api.admin_brands_deleted");
  const list = Array.isArray(data) ? data : [];
  const [busy, setBusy] = useState(null);
  const [toast, say] = useToast();

  const restore = async (d) => {
    setBusy(d.brand_id);
    const r = await rpc("admin", "api.admin_brand_restore", { p_brand: d.brand_id });
    setBusy(null);
    if (r.error) return say(errText(r.error));
    const back = Number(r.data?.logins_back) || 0;
    say(`↩ ${d.name} restored${back ? ` · ${back} login${back === 1 ? "" : "s"} can sign in again` : ""}`);
    reload(true);
  };

  return (
    <AdminShell>
      <PageHead title="Deleted brands" sub="Brands removed from the CRM. Campaigns, bills and reports are kept — restore any time.">
        <Link href="/admin/brands" className="ad-btn ad-btn--ghost db-back">
          ← Brand CRM
        </Link>
      </PageHead>

      <section className="ad-card db-card">
        <h2 className="ad-h2">Deleted · {loading ? "…" : list.length}</h2>
        {loading || error ? (
          <p className={`db-state ${error ? "is-err" : ""}`}>
            {loading ? "Loading…" : `Couldn’t load: ${errText(error)}`}{" "}
            {error && (
              <button type="button" onClick={() => reload()}>
                Retry
              </button>
            )}
          </p>
        ) : (
        <PTable
          minW={640}
          rowH={70}
          cols={[
            { label: "Brand", w: "21.5%" },
            { label: "Deleted", w: "19.5%" },
            { label: "By", w: "13.5%" },
            { label: "Campaigns kept", w: "26%" },
            { label: "", w: "19.5%" },
          ]}
          rows={list.map((d) => [
            <b key="n" title={d.name}>{d.name}</b>,
            fmtDate(d.deleted_at),
            d.by || "—",
            num(d.campaigns),
            <button key="r" type="button" className="ad-btn ad-btn--ghost ad-btn--sm db-r" onClick={() => restore(d)} disabled={busy === d.brand_id}>
              {busy === d.brand_id ? "Restoring…" : "Restore"}
            </button>,
          ])}
          empty="Nothing deleted — every brand is in the CRM."
        />
        )}
      </section>

      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        .db-card { padding: 22px 22px 26px; }
        .db-card .ad-h2 { margin-bottom: 22px; }
        .db-card .pt td:last-child { overflow: visible; }
        .db-state { padding: 14px 11px; font-size: 13px; color: var(--ad-muted); }
        .db-state.is-err { color: var(--ad-red); }
        .db-state button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .db-r { height: 33px; padding: 0 12px; font-size: 12px; color: #5145bb; }
        @media (max-width: 640px) { .db-card { padding: 18px 16px; } }
      `}</style>
    </AdminShell>
  );
}
