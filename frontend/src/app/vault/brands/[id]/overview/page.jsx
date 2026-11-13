"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandPanel, { STATUS, useBrand } from "@/components/admin/brand/BrandPanel";
import { rpc, errText } from "@/lib/supabase";
import { fmtDate, useToast } from "@/components/admin/brand/util";

/** /vault/brands/[id]/overview — Details + Contacts (Figma 065) */
export default function BrandOverviewPage() {
  const { id } = useParams();
  return (
    <BrandPanel id={id}>
      <BrandOverview />
    </BrandPanel>
  );
}

/* brand_detail se: details (brand_save), delete (admin_brand_delete), contacts (brand_contact_save / _delete) */
function BrandOverview() {
  const { d, b, reload } = useBrand();
  const router = useRouter();
  const contacts = d.contacts || [];
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(false);
  const [adding, setAdding] = useState(null); // null | {} (naya) | contact (edit)
  const [c, setC] = useState({ name: "", role: "", email: "", phone: "" });
  const [rmId, setRmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, say] = useToast();

  const startEdit = () => {
    setForm({ status: b.status || "active", website: b.website || "", category: b.category || "" });
    setEdit(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await rpc("admin", "api.brand_save", { p: { brand_id: b.brand_id, status: form.status, website: form.website.trim(), category: form.category.trim() } });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    setEdit(false);
    say("Brand details saved ✓");
    reload(true);
  };

  const del = async () => {
    setBusy(true);
    const r = await rpc("admin", "api.admin_brand_delete", { p_brand: b.brand_id });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    router.push("/vault/brands/deleted");
  };

  const openContact = (x) => {
    setC(x ? { name: x.name || "", role: x.role || "", email: x.email || "", phone: x.phone || "" } : { name: "", role: "", email: "", phone: "" });
    setAdding(x || {});
  };
  const saveContact = async (e) => {
    e.preventDefault();
    if (!c.name.trim()) return;
    setBusy(true);
    const p = { brand_id: b.brand_id, contact_id: adding?.contact_id || null, name: c.name.trim(), role: c.role.trim(), email: c.email.trim(), phone: c.phone.trim(), is_primary: adding?.contact_id ? !!adding.is_primary : !contacts.length };
    const r = await rpc("admin", "api.brand_contact_save", { p });
    setBusy(false);
    if (r.error) return say(errText(r.error));
    setAdding(null);
    say(adding?.contact_id ? "Contact saved ✓" : "Contact added ✓");
    reload(true);
  };
  const removeContact = async (x) => {
    setRmId(null);
    const r = await rpc("admin", "api.brand_contact_delete", { p_contact: x.contact_id });
    if (r.error) return say(errText(r.error));
    say("Contact removed");
    reload(true);
  };

  const cell = { status: STATUS[b.status] || "Active client", added: fmtDate(b.created_at), website: b.website || "—", category: b.category || "—" };
  const DET = [
    ["Status", "status"],
    ["Added", "added"],
    ["Website", "website"],
    ["Category", "category"],
  ];

  return (
    <>
      <section className="bp-sec bo-sec">
        <h3 className="bp-sec__t">Details</h3>
        {edit ? (
          <form className="bo-form" onSubmit={save}>
            <div className="bo-grid">
              {DET.map(([l, k]) => (
                <div key={k}>
                  <label className="ga-label" htmlFor={`bo-${k}`}>
                    {l}
                  </label>
                  {k === "status" ? (
                    <select id={`bo-${k}`} className="ga-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS).map(([v, t]) => (
                        <option key={v} value={v}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : k === "added" ? (
                    <input id={`bo-${k}`} className="ga-input" value={cell.added} disabled />
                  ) : (
                    <input id={`bo-${k}`} className="ga-input" value={form[k]} maxLength={k === "website" ? 200 : 60} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
            <div className="bp-btns">
              <button type="submit" className="ga-btn ga-btn--primary" disabled={busy}>
                {busy ? "Saving…" : "Save details"}
              </button>
              <button type="button" className="bp-plain" onClick={() => setEdit(false)}>
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
                  <strong title={cell[k]}>{cell[k]}</strong>
                </div>
              ))}
            </div>
            {confirmDel ? (
              <div className="bo-confirm">
                <p>
                  Delete <b>{b.name}</b>?{" "}
                  {(d.logins || []).length === 1 ? "Its brand login loses access straight away. " : (d.logins || []).length > 1 ? `Its ${(d.logins || []).length} brand logins lose access straight away. ` : ""}
                  Campaigns, bills and reports are kept — you can restore it any time.
                </p>
                <div className="bp-btns">
                  <button type="button" className="ga-btn ga-btn--danger" onClick={del} disabled={busy}>
                    {busy ? "Deleting…" : "Yes, delete brand"}
                  </button>
                  <button type="button" className="bp-plain" onClick={() => setConfirmDel(false)}>
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <div className="bp-btns">
                <button type="button" className="ga-btn ga-btn--ghost" onClick={startEdit}>
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
            {contacts.map((x) => (
              <li key={x.contact_id}>
                <span className="ga-av">{String(x.name || "?")[0].toUpperCase()}</span>
                <div>
                  <strong>
                    {x.name}
                    {x.is_primary && <em className="bo-main">Main</em>}
                  </strong>
                  <small>{[x.role, x.email, x.phone].filter(Boolean).join(" · ") || "No details"}</small>
                </div>
                {rmId === x.contact_id ? (
                  <>
                    <button type="button" className="bp-plain bo-rm" onClick={() => removeContact(x)}>
                      Yes, remove
                    </button>
                    <button type="button" className="bp-plain" onClick={() => setRmId(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="bp-plain" onClick={() => openContact(x)}>
                      Edit
                    </button>
                    <button type="button" className="bp-plain" onClick={() => setRmId(x.contact_id)}>
                      Remove
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="bp-sec__s">No contacts yet.</p>
        )}
        {adding ? (
          <form className="bo-form" onSubmit={saveContact}>
            <div className="bo-grid">
              {[
                ["name", "Name", "Rahul Sharma"],
                ["role", "Role", "Marketing manager"],
                ["email", "Email", "rahul@brand.in"],
                ["phone", "Phone", "+91 98765 43210"],
              ].map(([k, l, ph]) => (
                <div key={k}>
                  <label className="ga-label" htmlFor={`bc-${k}`}>
                    {l}
                  </label>
                  <input id={`bc-${k}`} className="ga-input" placeholder={ph} value={c[k]} type={k === "email" ? "email" : "text"} maxLength={k === "email" ? 120 : k === "phone" ? 20 : 80} onChange={(e) => setC({ ...c, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <div className="bp-btns">
              <button type="submit" className="ga-btn ga-btn--primary" disabled={!c.name.trim() || busy}>
                {busy ? "Saving…" : "Save contact"}
              </button>
              <button type="button" className="bp-plain" onClick={() => setAdding(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="bp-btns bo-addc">
            <button type="button" className="ga-btn ga-btn--ghost" onClick={() => openContact(null)}>
              ➕ Add contact
            </button>
          </div>
        )}
      </section>

      {toast && <div className="ga-toast">{toast}</div>}

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
        .bo-list .bo-rm { color: var(--ad-red); }
        .bo-main { margin-left: 6px; padding: 1px 7px; border-radius: 8px; background: var(--ad-green-bg); color: var(--ad-green); font-style: normal; font-size: 10.5px; font-weight: 700; vertical-align: 1px; }
        .bo-cell strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 560px) { .bo-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
