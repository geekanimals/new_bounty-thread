"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandPanel from "@/components/admin/brand/BrandPanel";
import { brandInfo, getDeleted, setDeleted } from "@/components/admin/brand/store";

/** /admin/brands/[id]/overview — Details + Contacts (Figma 065) */
export default function BrandOverview() {
  const { id } = useParams();
  const router = useRouter();
  const [b, setB] = useState(() => brandInfo(id));
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(b);
  const [confirmDel, setConfirmDel] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [c, setC] = useState({ name: "", role: "", email: "", phone: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const x = brandInfo(id);
    setB(x);
    setForm(x);
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const save = (e) => {
    e.preventDefault();
    setB({ ...b, ...form });
    setEdit(false);
    setToast("Brand details saved");
  };

  const del = () => {
    const d = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
    setDeleted([{ id: b.id, name: b.name, on: d, by: "Mayank", kept: b.campaigns }, ...getDeleted().filter((x) => x.id !== b.id)]);
    router.push("/admin/brands/deleted");
  };

  const addContact = (e) => {
    e.preventDefault();
    if (!c.name.trim()) return;
    setContacts([...contacts, { ...c, name: c.name.trim() }]);
    setC({ name: "", role: "", email: "", phone: "" });
    setAdding(false);
    setToast("Contact added");
  };

  const DET = [
    ["Status", "status"],
    ["Added", "added"],
    ["Website", "website"],
    ["Category", "category"],
  ];

  return (
    <BrandPanel id={id}>
      <section className="bp-sec bo-sec">
        <h3 className="bp-sec__t">Details</h3>
        {edit ? (
          <form className="bo-form" onSubmit={save}>
            <div className="bo-grid">
              {DET.map(([l, k]) => (
                <div key={k}>
                  <label className="ad-label" htmlFor={`bo-${k}`}>
                    {l}
                  </label>
                  {k === "status" ? (
                    <select id={`bo-${k}`} className="ad-input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>
                      <option>Active client</option>
                      <option>Lead</option>
                      <option>Paused</option>
                    </select>
                  ) : (
                    <input id={`bo-${k}`} className="ad-input" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} disabled={k === "added"} />
                  )}
                </div>
              ))}
            </div>
            <div className="bp-btns">
              <button type="submit" className="ad-btn ad-btn--primary">
                Save details
              </button>
              <button type="button" className="bp-plain" onClick={() => (setEdit(false), setForm(b))}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="bo-grid">
              {DET.map(([l, k]) => (
                <div key={k} className="bo-cell">
                  <span>{l}</span>
                  <strong>{b[k]}</strong>
                </div>
              ))}
            </div>
            {confirmDel ? (
              <div className="bo-confirm">
                <p>
                  Delete <b>{b.name}</b>? Campaigns, bills and reports are kept — you can restore it any time.
                </p>
                <div className="bp-btns">
                  <button type="button" className="ad-btn ad-btn--danger" onClick={del}>
                    Yes, delete brand
                  </button>
                  <button type="button" className="bp-plain" onClick={() => setConfirmDel(false)}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <div className="bp-btns">
                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setEdit(true)}>
                  ✏️ Edit details
                </button>
                <button type="button" className="bp-plain" onClick={() => setConfirmDel(true)}>
                  🗑️ Delete brand
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="bp-sec bo-contacts">
        <h3 className="bp-sec__t">Contacts</h3>
        {contacts.length ? (
          <ul className="bo-list">
            {contacts.map((x, i) => (
              <li key={i}>
                <span className="ad-av">{x.name[0].toUpperCase()}</span>
                <div>
                  <strong>{x.name}</strong>
                  <small>{[x.role, x.email, x.phone].filter(Boolean).join(" · ") || "No details"}</small>
                </div>
                <button type="button" className="bp-plain" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bp-sec__s">No contacts yet.</p>
        )}
        {adding ? (
          <form className="bo-form" onSubmit={addContact}>
            <div className="bo-grid">
              {[
                ["name", "Name", "Rahul Sharma"],
                ["role", "Role", "Marketing manager"],
                ["email", "Email", "rahul@brand.in"],
                ["phone", "Phone", "+91 98765 43210"],
              ].map(([k, l, ph]) => (
                <div key={k}>
                  <label className="ad-label" htmlFor={`bc-${k}`}>
                    {l}
                  </label>
                  <input id={`bc-${k}`} className="ad-input" placeholder={ph} value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="bp-btns">
              <button type="submit" className="ad-btn ad-btn--primary" disabled={!c.name.trim()}>
                Save contact
              </button>
              <button type="button" className="bp-plain" onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bp-btns bo-addc">
            <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAdding(true)}>
              ➕ Add contact
            </button>
          </div>
        )}
      </section>

      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .bo-sec { padding-bottom: 24px; }
        .bo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
        .bo-cell { display: flex; flex-direction: column; justify-content: center; min-height: 79px; padding: 0 19px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .bo-cell span { font-size: 11px; letter-spacing: .5px; text-transform: uppercase; color: var(--ad-muted); }
        .bo-cell strong { margin-top: 5px; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .bo-sec .bp-btns { margin-top: 22px; }
        .bo-contacts { margin-top: 26px !important; }
        .bo-contacts .bp-sec__s { margin-top: 13px; }
        .bo-addc { margin-top: 15px; }
        .bo-confirm { margin-top: 18px; padding: 14px 16px; border-radius: 14px; background: var(--ad-red-bg); }
        .bo-confirm p { font-size: 13px; color: var(--ad-red); }
        .bo-confirm .bp-btns { margin-top: 10px; }
        .bo-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 8px; }
        .bo-list li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 13px; border: 1px solid var(--ad-line); }
        .bo-list li div { flex: 1; min-width: 0; }
        .bo-list strong { display: block; font-size: 14px; font-weight: 700; }
        .bo-list small { display: block; margin-top: 2px; font-size: 12px; color: var(--ad-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bo-list .bp-plain { height: 32px; padding: 0 6px; font-size: 13px; }
        @media (max-width: 560px) { .bo-grid { grid-template-columns: 1fr; } }
      `}</style>
    </BrandPanel>
  );
}
