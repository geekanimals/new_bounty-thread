"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import PTable from "@/components/admin/brand/PTable";
import { DELETED_SEED, getDeleted, setDeleted } from "@/components/admin/brand/store";

/** /admin/brands/deleted — Deleted brands (Figma 057) */
export default function DeletedBrands() {
  const [list, setList] = useState(DELETED_SEED);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const sync = () => setList(getDeleted());
    sync();
    window.addEventListener("geek-brands", sync);
    return () => window.removeEventListener("geek-brands", sync);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const restore = (d) => {
    setDeleted(getDeleted().filter((x) => x.id !== d.id));
    setToast(`${d.name} restored to the CRM`);
  };

  return (
    <AdminShell>
      <PageHead title="Deleted brands" sub="Brands removed from the CRM. Campaigns, bills and reports are kept — restore any time.">
        <Link href="/admin/brands" className="ad-btn ad-btn--ghost db-back">
          ← Brand CRM
        </Link>
      </PageHead>

      <section className="ad-card db-card">
        <h2 className="ad-h2">Deleted · {list.length}</h2>
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
            <b key="n">{d.name}</b>,
            d.on,
            d.by,
            d.kept,
            <button key="r" type="button" className="ad-btn ad-btn--ghost ad-btn--sm db-r" onClick={() => restore(d)}>
              Restore
            </button>,
          ])}
          empty="Nothing deleted — every brand is in the CRM."
        />
      </section>

      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .db-card { padding: 22px 22px 26px; }
        .db-card .ad-h2 { margin-bottom: 22px; }
        .db-card .pt td:last-child { overflow: visible; }
        .db-r { height: 33px; padding: 0 12px; font-size: 12px; color: #5145bb; }
        @media (max-width: 640px) { .db-card { padding: 18px 16px; } }
      `}</style>
    </AdminShell>
  );
}
