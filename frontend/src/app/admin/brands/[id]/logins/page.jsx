"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BrandPanel from "@/components/admin/brand/BrandPanel";
import PTable from "@/components/admin/brand/PTable";
import { brandById } from "@/components/admin/data";

/** /admin/brands/[id]/logins — Brand logins + Brand portal (Figma 069) */
export default function BrandLogins() {
  const { id } = useParams();
  const b = brandById(id);
  const domain = b.id === "beardo" ? "beardo.in" : `${b.id.replace(/-/g, "")}.in`;
  const [rows, setRows] = useState(b.login ? [{ name: `Rahul (${b.name})`, email: `rahul@${domain}`, access: "Brand reviewer", last: "Yesterday" }] : []);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", email: "", access: "Brand reviewer" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const add = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setToast("Add a name and a valid email");
    setRows([...rows, { name: f.name.trim(), email: f.email.trim(), access: f.access, last: "Invite sent" }]);
    setF({ name: "", email: "", access: "Brand reviewer" });
    setAdding(false);
    setToast(`Login invite sent to ${f.email.trim()}`);
  };

  return (
    <BrandPanel id={id} logins={rows.length}>
      <section className="bp-sec bl-sec">
        <h3 className="bp-sec__t">Brand logins</h3>
        <div className="bl-t">
          <PTable
            minW={620}
            rowH={64}
            cols={[
              { label: "Person", w: "22.5%" },
              { label: "Email", w: "24.5%" },
              { label: "Access", w: "22.5%" },
              { label: "Last sign-in", w: "20%" },
              { label: "", w: "10.5%" },
            ]}
            rows={rows.map((r, i) => [
              r.name,
              r.email,
              r.access,
              r.last,
              <button key="x" type="button" className="pt-link bl-rm" onClick={() => (setRows(rows.filter((_, j) => j !== i)), setToast(`${r.name} can no longer sign in`))}>
                Remove
              </button>,
            ])}
            empty="No brand logins yet."
          />
        </div>
        {adding && (
          <form className="bl-form" onSubmit={add}>
            <input className="ad-input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} aria-label="Name" autoFocus />
            <input className="ad-input" placeholder="name@brand.in" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="Email" />
            <select className="ad-input" value={f.access} onChange={(e) => setF({ ...f, access: e.target.value })} aria-label="Access">
              <option>Brand reviewer</option>
              <option>Brand admin</option>
              <option>View only</option>
            </select>
            <button type="submit" className="ad-btn ad-btn--primary">
              Send invite
            </button>
          </form>
        )}
        <div className="bp-btns">
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => setAdding(!adding)}>
            🔑 {adding ? "Cancel" : "Add a login"}
          </button>
          <a href="/brands" target="_blank" rel="noreferrer" className="ad-btn ad-btn--ghost">
            👁️ View as brand
          </a>
        </div>
      </section>

      <section className="bp-sec bl-portal" id="portal">
        <h3 className="bp-sec__t">🏢 Brand portal</h3>
        <p className="bp-sec__s">What {b.name} sees: their campaigns, the final creator list to approve, posts and the report.</p>
        <div className="bp-btns">
          <a href="/brands" target="_blank" rel="noreferrer" className="ad-btn ad-btn--ghost">
            Open brand portal ↗
          </a>
        </div>
      </section>

      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .bl-t { margin-top: 13px; }
        .bl-t .pt th { height: 37px; }
        .bl-rm { color: #6657e9; }
        .bl-sec .bp-btns { margin-top: 10px; }
        .bl-portal { margin-top: 19px !important; }
        .bl-portal .bp-sec__s { margin-top: 13px; }
        .bl-portal .bp-btns { margin-top: 9px; }
        .bl-form { display: grid; grid-template-columns: 1fr 1.2fr 1fr auto; gap: 8px; margin-top: 12px; }
        @media (max-width: 640px) { .bl-form { grid-template-columns: 1fr; } }
      `}</style>
    </BrandPanel>
  );
}
