"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession } from "@/components/creater/session";
import { Check, Pin, Trash, Edit } from "@/components/ui/Icons";

const STATES = ["Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

// Dummy PIN lookup — asli app mein PIN API se aayega
const PINS = {
  "302001": { city: "Jaipur", state: "Rajasthan" },
  "302017": { city: "Jaipur", state: "Rajasthan" },
  "110001": { city: "New Delhi", state: "Delhi" },
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "560001": { city: "Bengaluru", state: "Karnataka" },
};

// Figma: shuru mein koi saved address nahi (empty) — save karne par list banti hai
const EMPTY = { flat: "", area: "", landmark: "", city: "", state: "", pin: "", name: "Shivam Rathore", phone: "8936096607", notes: "", label: "Home" };

/** /creater/profile/address — brands kit kahan bhejein (saved list + naya address) */
export default function Address() {
  const [s, update] = useSession();
  const [list, setList] = useState([]);
  const [makeDefault, setMakeDefault] = useState(true);
  const [f, setF] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [notesOpen, setNotesOpen] = useState(true);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (s.addresses?.length) setList(s.addresses);
  }, [s.addresses]);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };
  const save = (next) => {
    setList(next);
    update({ addresses: next });
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // PIN: 6 digit hote hi city/state bhar do
  const setPin = (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    const hit = PINS[pin];
    setF((x) => ({ ...x, pin, ...(hit || {}) }));
  };

  const useLocation = () => {
    setF((x) => ({ ...x, flat: "B-204, Green Park Society", area: "Malviya Nagar, Sector 7", landmark: "Near Apollo Pharmacy", city: "Jaipur", state: "Rajasthan", pin: "302017" }));
    setSearch("Malviya Nagar, Jaipur");
    flash("Location found — check the details");
  };

  const req = ["pin", "city", "state", "flat", "area", "landmark", "name", "phone"];
  const bad = (k) => tried && (!f[k] || (k === "pin" && f.pin.length !== 6) || (k === "phone" && f.phone.length !== 10));
  const valid = req.every((k) => f[k]) && f.pin.length === 6 && f.phone.length === 10;

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    if (editId) {
      save(list.map((a) => (a.id === editId ? { ...a, ...f } : a)));
      flash("Address updated");
    } else {
      const def = makeDefault || list.length === 0;
      save([...list.map((x) => (def ? { ...x, isDefault: false } : x)), { ...f, id: Date.now(), isDefault: def }]);
      flash("Address saved");
    }
    setF(EMPTY);
    setEditId(null);
    setTried(false);
    setSearch("");
  };

  const edit = (a) => {
    setF({ ...EMPTY, ...a });
    setEditId(a.id);
    document.getElementById("ad-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <BountyShell>
      <title>Delivery address — Bounty</title>
      <Link href="/creater/profile" className="pf-back">
        ← My profile
      </Link>

      <section className="pf-card ad">
        <div className="ad-head">
          <h1>Delivery addresses *</h1>
          <span>Every field required · checked on the map</span>
        </div>

        {list.length > 0 && (
          <ul className="ad-list">
            {list.map((a) => (
              <li key={a.id} className={a.isDefault ? "is-default" : ""}>
                <span className="ad-list__pin">
                  <Pin size={15} />
                </span>
                <div className="ad-list__txt">
                  <strong>
                    {a.label} {a.isDefault && <em className="ad-def">Default</em>}
                  </strong>
                  <p>
                    {a.name} · +91 {a.phone}
                    <br />
                    {a.flat}, {a.area}, {a.landmark}, {a.city}, {a.state} — {a.pin}
                  </p>
                </div>
                <div className="ad-list__act">
                  {!a.isDefault && (
                    <button type="button" onClick={() => save(list.map((x) => ({ ...x, isDefault: x.id === a.id })))}>
                      Make default
                    </button>
                  )}
                  <button type="button" onClick={() => edit(a)} aria-label={`Edit ${a.label} address`}>
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    className="is-red"
                    onClick={() => {
                      const next = list.filter((x) => x.id !== a.id);
                      if (a.isDefault && next[0]) next[0] = { ...next[0], isDefault: true };
                      save(next);
                      flash("Address deleted");
                    }}
                    aria-label={`Delete ${a.label} address`}
                  >
                    <Trash size={13} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form id="ad-form" className="ad-form" onSubmit={submit} noValidate>
          <h2>{editId ? "Edit address" : "Add a new address"}</h2>

          <div className="ad-search">
            <label className="ad-label" htmlFor="ad-q">
              🔎 Search your address
            </label>
            <input id="ad-q" className="pf-input ad-in" placeholder="Type your building, society, street or area…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="ad-loc" onClick={useLocation}>
              📍 Use my current location
            </button>
          </div>

          <div className="ad-grid">
            <div className="ad-pinbox">
              <label className="ad-label" htmlFor="ad-pin">
                PIN code <i>*</i>
              </label>
              <input id="ad-pin" className="pf-input ad-in ad-pin" inputMode="numeric" placeholder="6-digit PIN — fills city & state" value={f.pin} onChange={setPin} />
              {bad("pin") && <p className="bx-err">Enter a 6-digit PIN.</p>}
            </div>
            <div className="ad-blank" />
            <div>
              <label className="ad-label" htmlFor="ad-city">
                Town/City <i>*</i>
              </label>
              <input id="ad-city" className="pf-input ad-in" value={f.city} onChange={set("city")} />
              {bad("city") && <p className="bx-err">Required.</p>}
            </div>
            <div>
              <label className="ad-label" htmlFor="ad-state">
                State <i>*</i>
              </label>
              <select id="ad-state" className="pf-input ad-in" value={f.state} onChange={set("state")}>
                <option value="">Choose a state</option>
                {STATES.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
              {bad("state") && <p className="bx-err">Required.</p>}
            </div>
            <div className="ad-full">
              <label className="ad-label" htmlFor="ad-flat">
                Flat, House no., Building, Apartment <i>*</i>
              </label>
              <input id="ad-flat" className="pf-input ad-in" placeholder="E.g. B-204, Green Park Society" value={f.flat} onChange={set("flat")} />
              {bad("flat") && <p className="bx-err">Required.</p>}
            </div>
            <div className="ad-full">
              <label className="ad-label" htmlFor="ad-area">
                Area, Street, Sector, Village <i>*</i>
              </label>
              <input id="ad-area" className="pf-input ad-in" placeholder="Start typing — pick from the list" value={f.area} onChange={set("area")} />
              {bad("area") && <p className="bx-err">Required.</p>}
            </div>
            <div className="ad-full">
              <label className="ad-label" htmlFor="ad-land">
                Landmark <i>*</i>
              </label>
              <input id="ad-land" className="pf-input ad-in" placeholder="Type a nearby place — e.g. Apollo" value={f.landmark} onChange={set("landmark")} />
              {bad("landmark") && <p className="bx-err">Required.</p>}
            </div>
            <div>
              <label className="ad-label" htmlFor="ad-name">
                Receiver's full name <i>*</i>
              </label>
              <input id="ad-name" className="pf-input ad-in" value={f.name} onChange={set("name")} />
              {bad("name") && <p className="bx-err">Required.</p>}
            </div>
            <div>
              <label className="ad-label" htmlFor="ad-phone">
                Mobile number <i>*</i>
              </label>
              <div className="ad-phone">
                <span>+91</span>
                <input id="ad-phone" className="pf-input ad-in" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
              </div>
              {bad("phone") && <p className="bx-err">Enter a 10-digit number.</p>}
            </div>
          </div>

          {/* Delivery instructions (optional) — Figma: link khulte hi textarea */}
          <button type="button" className="ad-notes-btn" onClick={() => setNotesOpen(!notesOpen)} aria-expanded={notesOpen}>
            Delivery instructions (optional)
          </button>
          {notesOpen && <textarea className="pf-input ad-notes" rows={2} placeholder="E.g. call before delivery, gate code, best time" value={f.notes} onChange={set("notes")} />}

          <label className="pf-label ad-saveas" htmlFor="ad-label">
            Save as
          </label>
          <select id="ad-label" className="pf-input ad-in ad-labelsel" value={f.label} onChange={set("label")}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>

          <label className="ad-default">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
            Make this my default address
          </label>

          {tried && !valid && <p className="bx-err">Please fill all required fields.</p>}
          <div className="ad-btns">
            {editId && (
              <button
                type="button"
                className="ad-cancel"
                onClick={() => {
                  setF(EMPTY);
                  setEditId(null);
                  setTried(false);
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="pf-btn ad-save">
              {editId ? "Update address" : "Save address"}
            </button>
          </div>
          <p className="ad-foot">Your full address is private, used only for campaign logistics you approve — never shown in search or to brands.</p>
        </form>
      </section>

      {toast && (
        <div className="bx-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        /* Figma: DM Sans form card — header line, safed inputs, "Private" chip */
        .pf-back { display: inline-block; margin: 4px 0 26px; font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .pf-back:hover { color: var(--bx-red); }
        .pf-card { padding: 20px 20px 18px; border-radius: 16px; background: rgba(251,241,220,.82); border: 1px solid var(--bx-line); box-shadow: 0 10px 24px -20px rgba(60,40,10,.45); }
        .pf-h { margin: 0 0 12px; padding-bottom: 14px; font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; border-bottom: 1px solid var(--bx-line); }
        .pf-label { display: flex; align-items: center; gap: 8px; margin: 0 0 7px; font-size: 12.5px; font-weight: 600; color: #6b5a3a; }
        .pf-label small { padding: 1px 6px; border-radius: 5px; background: #ebe2cd; font-size: 10px; font-weight: 600; color: #7a8290; }
        .pf-input { width: 100%; height: 38px; padding: 0 10px; border-radius: 10px; border: 1px solid #d9c9a3; background: #fffdf8; outline: none; font-size: 14px; font-weight: 500; color: var(--bx-ink); }
        .pf-input::placeholder { color: #757575; }
        .pf-input:focus { border-color: var(--bx-gold); box-shadow: 0 0 0 3px rgba(232,176,74,.2); }
        select.pf-input { appearance: none; }
        textarea.pf-input { height: auto; padding: 9px 10px; }
        .pf-hint { margin: 6px 0 0; font-size: 12px; color: #6b5a3a; }
        .pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 38px; padding: 0 16px; border: 0; border-radius: 999px; background: var(--bx-green); color: var(--bx-cream); font-family: var(--bx-jak); font-size: 14px; font-weight: 700; white-space: nowrap; }
        .pf-btn:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
          .pf-back { margin-bottom: 20px; }
          .pf-card { padding: 16px; }
        }
        .ad-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 0 -20px; padding: 0 20px 12px; border-bottom: 1px solid var(--bx-line); }
        .ad-head h1 { font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .ad-head span { font-size: 12px; color: #6b5a3a; text-align: right; }
        .ad-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 10px; max-width: 640px; }
        .ad-list li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; border: 1px solid #d9c9a3; background: #fffdf8; }
        .ad-list li.is-default { border-color: var(--bx-teal); }
        .ad-list__pin { width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; background: #f6e3bd; color: var(--bx-red); display: grid; place-items: center; }
        .ad-list__txt { flex: 1; min-width: 0; }
        .ad-list__txt strong { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
        .ad-def { font-style: normal; padding: 1px 7px; border-radius: 5px; background: #d3eeec; color: #1f6f69; font-size: 10.5px; font-weight: 700; }
        .ad-list__txt p { margin: 4px 0 0; font-size: 12.5px; color: #6b5a3a; line-height: 1.5; overflow-wrap: anywhere; }
        .ad-list__act { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .ad-list__act button { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-size: 12px; font-weight: 700; }
        .ad-list__act button.is-red { color: var(--bx-red); }
        .ad-form { margin-top: 18px; scroll-margin-top: 90px; max-width: 640px; }
        .ad-form h2 { font-family: var(--bx-sans); font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .ad-label { display: flex; align-items: center; gap: 4px; margin: 0 0 6px; font-size: 13.5px; font-weight: 700; color: var(--bx-ink); }
        .ad-label i { font-style: normal; color: #dc2626; }
        .ad-in { height: 40px; padding: 0 12px; border-radius: 12px; }
        .ad-search { padding: 12px 12px 12px; border-radius: 12px; background: #e9e7d6; border: 1px solid #cfd6bf; }
        .ad-search .ad-label { margin-bottom: 8px; }
        .ad-search .ad-in { height: 44px; padding: 0 14px; }
        .ad-loc { display: inline-flex; align-items: center; gap: 4px; height: 40px; margin-top: 8px; padding: 0 14px; border-radius: 12px; border: 1px solid #c9b88f; background: #fffdf8; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .ad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin-top: 18px; }
        .ad-pinbox { max-width: 220px; }
        .ad-full { grid-column: 1 / -1; }
        .ad-pin::placeholder { letter-spacing: 2px; }
        .ad-pin { letter-spacing: 2px; }
        .ad-phone { display: flex; }
        .ad-phone span { display: grid; place-items: center; padding: 0 10px; border: 1px solid #d9c9a3; border-right: 0; border-radius: 12px 0 0 12px; background: #efebe3; font-size: 14px; font-weight: 600; }
        .ad-phone .ad-in { border-radius: 0 12px 12px 0; min-width: 0; }
        .ad-notes-btn { display: block; margin: 14px 12px 0; padding: 0; border: 0; background: none; font-size: 13.5px; font-weight: 700; color: #007185; }
        .ad-notes { margin-top: 8px; }
        .ad-saveas { margin: 12px 0 6px; }
        .ad-labelsel { max-width: 532px; }
        .ad-default { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; font-size: 13px; color: var(--bx-ink); cursor: pointer; }
        .ad-default input { width: 14px; height: 14px; margin: 0; accent-color: var(--bx-green); }
        .ad-btns { display: flex; gap: 10px; margin: 14px 0 0; }
        .ad-save { height: 40px; padding: 0 18px; }
        .ad-cancel { height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-weight: 700; }
        .ad-foot { margin: 14px 0 0; font-size: 12px; line-height: 1.5; color: #6b5a3a; }
        @media (max-width: 767px) {
          .ad-head { margin: 0 -16px; padding: 0 16px 14px; }
          .ad-head h1 { max-width: 90px; }
          .ad-grid { grid-template-columns: 1fr; }
          .ad-blank { display: none; }
          .ad-pinbox { max-width: none; }
          .ad-list li { flex-wrap: wrap; }
          .ad-list__act { width: 100%; justify-content: flex-start; }
        }
      `}</style>
    </BountyShell>
  );
}
