"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import { useSession, useCreator, geoLookup, saveAddress, setDefaultAddress, deleteAddress, INDIA_STATES, canonState, phone10 } from "@/services/creator";
import { Check, Pin, Trash, Edit } from "@/components/ui/Icons";


// Figma: shuru mein koi saved address nahi (empty) — save karne par list banti hai
const EMPTY = { flat: "", area: "", landmark: "", city: "", state: "", pin: "", name: "", phone: "", notes: "", label: "Home" };
// "Save as": screen ka Work = database ka Office (purane app ke labels)
const LABEL_DB = { Home: "Home", Work: "Office", Other: "Other" };
const LABEL_UI = (l) => (l === "Office" ? "Work" : ["Home", "Other"].includes(l) ? l : l ? "Other" : "Home");
const geo = (body) => geoLookup(body).then((r) => r.data || null);

/** database address → form / list shape */
const fromDb = (a) => ({
  id: a.address_id,
  flat: a.line1 || "",
  area: a.line2 || "",
  landmark: a.landmark || "",
  city: a.city || "",
  state: canonState(a.state) || a.state || "",
  pin: a.postal_code || "",
  name: a.recipient_name || "",
  phone: phone10(a.recipient_phone),
  notes: a.delivery_instructions || "",
  label: LABEL_UI(a.label),
  isDefault: !!a.is_default,
  lat: a.lat,
  lng: a.lng,
});

/** /creater/profile/address — brands kit kahan bhejein (saved list + naya address) — upsert_address / delete_address */
export default function Address() {
  const [s] = useSession();
  const c = useCreator();
  const list = (c.profile?.addresses || []).map(fromDb).sort((x, y) => (y.isDefault ? 1 : 0) - (x.isDefault ? 1 : 0));
  const [makeDefault, setMakeDefault] = useState(true);
  const [f, setF] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [notesOpen, setNotesOpen] = useState(true);
  const [tried, setTried] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [pinInfo, setPinInfo] = useState(null);
  const [coords, setCoords] = useState(null);
  const filled = useRef(false);

  // Receiver: apna naam + WhatsApp number pehle se
  useEffect(() => {
    if (filled.current || !c.ready || !c.profile) return;
    filled.current = true;
    setF((x) => ({ ...x, name: x.name || s.name || "", phone: x.phone || phone10(s.phone) }));
    if ((c.profile.addresses || []).length) setMakeDefault(false);
  }, [c, s.name, s.phone]);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  // PIN: 6 digit hote hi city/state (geo-lookup "pincode" — India Post)
  const setPin = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setF((x) => ({ ...x, pin }));
    setPinInfo(null);
    if (!/^[1-9]\d{5}$/.test(pin)) return;
    const r = await geo({ action: "pincode", pin });
    if (r && r.ok) {
      setPinInfo(r);
      setF((x) => ({ ...x, city: x.city || r.city || r.district || "", state: canonState(r.state) || x.state }));
    }
  };
  // 📍 current location → geo-lookup "reverse"
  const useLocation = () => {
    if (!navigator.geolocation) return flash("Location isn't available in this browser — type the address.");
    flash("📍 Locating…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await geo({ action: "reverse", lat: pos.coords.latitude, lon: pos.coords.longitude });
        if (!r || !r.ok) return flash("Couldn't look up your address — please type it.");
        setF((x) => ({
          ...x,
          flat: r.house || x.flat,
          area: r.street || x.area,
          landmark: r.landmark ? "Near " + r.landmark : x.landmark,
          city: r.city || x.city,
          state: canonState(r.state) || x.state,
          pin: r.pin ? String(r.pin).replace(/\D/g, "").slice(0, 6) : x.pin,
        }));
        setCoords({ lat: r.lat, lon: r.lon });
        setSearch([r.street, r.city].filter(Boolean).join(", "));
        flash("Location found — check the flat / house number");
      },
      () => flash("Location permission was denied — type the address."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  const req = ["pin", "city", "state", "flat", "area", "landmark", "name", "phone"];
  const bad = (k) => tried && (!f[k] || (k === "pin" && f.pin.length !== 6) || (k === "phone" && f.phone.length !== 10));
  const valid = req.every((k) => f[k]) && f.pin.length === 6 && f.phone.length === 10;

  const submit = async (e) => {
    e.preventDefault();
    setTried(true);
    if (!valid || busy) return;
    if (f.name.trim().split(/\s+/).length < 2) return flash("Add the receiver's full name (first and last).");
    if (!/^[6-9]\d{9}$/.test(f.phone)) return flash("Enter a valid 10-digit mobile number.");
    if (pinInfo && canonState(pinInfo.state) && canonState(pinInfo.state) !== f.state) return flash(`This PIN code is in ${pinInfo.state} — please pick that state.`);
    setBusy(true);
    try {
      // map par address check (geo-lookup "verify") — purane form jaisa
      const chk = await geo({ action: "verify", pin: f.pin, line1: f.flat.trim(), line2: f.area.trim(), landmark: f.landmark.trim(), city: f.city.trim(), state: f.state });
      if (chk && chk.ok && chk.pin_ok === false) throw new Error("This PIN code doesn't exist — please check it.");
      const at = chk && chk.found ? { lat: chk.lat, lon: chk.lon } : coords;
      const payload = {
        recipient_name: f.name.trim(),
        recipient_phone: "+91" + f.phone,
        line1: f.flat.trim(),
        line2: f.area.trim(),
        landmark: f.landmark.trim(),
        city: f.city.trim(),
        state: f.state,
        postal_code: f.pin,
        country: "India",
        delivery_instructions: f.notes.trim() || null,
        lat: at ? Math.round(at.lat * 1e6) / 1e6 : null,
        lng: at ? Math.round(at.lon * 1e6) / 1e6 : null,
        map_verified: !!(chk && chk.found && chk.near_pin !== false && chk.state_ok !== false),
        label: LABEL_DB[f.label] || "Other",
        is_default: editId ? undefined : makeDefault || list.length === 0,
      };
      if (editId) payload.address_id = editId;
      if (payload.is_default === undefined) delete payload.is_default;
      await saveAddress(payload);
      flash(editId ? "Address updated" : "Address saved");
      setF({ ...EMPTY, name: s.name || "", phone: phone10(s.phone) });
      setEditId(null);
      setTried(false);
      setSearch("");
      setCoords(null);
    } catch (ex) {
      flash("Couldn't save: " + (ex.message || ex));
    }
    setBusy(false);
  };
  const makeDef = async (a) => {
    try {
      await setDefaultAddress(a.id);
      flash("Default address updated");
    } catch (ex) {
      flash("Couldn't save: " + (ex.message || ex));
    }
  };
  const remove = async (a) => {
    if (!window.confirm(`Delete your ${a.label} address?`)) return;
    try {
      await deleteAddress(a.id);
      flash("Address deleted");
    } catch (ex) {
      flash("Couldn't delete: " + (ex.message || ex));
    }
  };
  const edit = (a) => {
    setF({ ...EMPTY, ...a });
    setEditId(a.id);
    document.getElementById("ga-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <BountyShell>
      <title>Delivery address — Bounty</title>
      <Link href="/creater/profile" className="pf-back">
        ← My profile
      </Link>

      <section className="pf-card ad">
        <div className="ga-head">
          <h1>Delivery addresses *</h1>
          <span>Every field required · checked on the map</span>
        </div>

        {list.length > 0 && (
          <ul className="ga-list">
            {list.map((a) => (
              <li key={a.id} className={a.isDefault ? "is-default" : ""}>
                <span className="ga-list__pin">
                  <Pin size={15} />
                </span>
                <div className="ga-list__txt">
                  <strong>
                    {a.label} {a.isDefault && <em className="ga-def">Default</em>}
                  </strong>
                  <p>
                    {a.name} · +91 {a.phone}
                    <br />
                    {a.flat}, {a.area}, {a.landmark}, {a.city}, {a.state} — {a.pin}
                  </p>
                </div>
                <div className="ga-list__act">
                  {!a.isDefault && (
                    <button type="button" onClick={() => makeDef(a)}>
                      Make default
                    </button>
                  )}
                  <button type="button" onClick={() => edit(a)} aria-label={`Edit ${a.label} address`}>
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    className="is-red"
                    onClick={() => remove(a)}
                    aria-label={`Delete ${a.label} address`}
                  >
                    <Trash size={13} /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form id="ga-form" className="ga-form" onSubmit={submit} noValidate>
          <h2>{editId ? "Edit address" : "Add a new address"}</h2>

          <div className="ga-search">
            <label className="ga-label" htmlFor="ga-q">
              🔎 Search your address
            </label>
            <input id="ga-q" className="pf-input ga-in" placeholder="Type your building, society, street or area…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="ga-loc" onClick={useLocation}>
              📍 Use my current location
            </button>
          </div>

          <div className="ga-grid">
            <div className="ga-pinbox">
              <label className="ga-label" htmlFor="ga-pin">
                PIN code <i>*</i>
              </label>
              <input id="ga-pin" className="pf-input ga-in ga-pin" inputMode="numeric" placeholder="6-digit PIN — fills city & state" value={f.pin} onChange={setPin} />
              {bad("pin") && <p className="bx-err">Enter a 6-digit PIN.</p>}
            </div>
            <div className="ga-blank" />
            <div>
              <label className="ga-label" htmlFor="ga-city">
                Town/City <i>*</i>
              </label>
              <input id="ga-city" className="pf-input ga-in" value={f.city} onChange={set("city")} />
              {bad("city") && <p className="bx-err">Required.</p>}
            </div>
            <div>
              <label className="ga-label" htmlFor="ga-state">
                State <i>*</i>
              </label>
              <select id="ga-state" className="pf-input ga-in" value={f.state} onChange={set("state")}>
                <option value="">Choose a state</option>
                {INDIA_STATES.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
              {bad("state") && <p className="bx-err">Required.</p>}
            </div>
            <div className="ga-full">
              <label className="ga-label" htmlFor="ga-flat">
                Flat, House no., Building, Apartment <i>*</i>
              </label>
              <input id="ga-flat" className="pf-input ga-in" placeholder="E.g. B-204, Green Park Society" value={f.flat} onChange={set("flat")} />
              {bad("flat") && <p className="bx-err">Required.</p>}
            </div>
            <div className="ga-full">
              <label className="ga-label" htmlFor="ga-area">
                Area, Street, Sector, Village <i>*</i>
              </label>
              <input id="ga-area" className="pf-input ga-in" placeholder="Start typing — pick from the list" value={f.area} onChange={set("area")} />
              {bad("area") && <p className="bx-err">Required.</p>}
            </div>
            <div className="ga-full">
              <label className="ga-label" htmlFor="ga-land">
                Landmark <i>*</i>
              </label>
              <input id="ga-land" className="pf-input ga-in" placeholder="Type a nearby place — e.g. Apollo" value={f.landmark} onChange={set("landmark")} />
              {bad("landmark") && <p className="bx-err">Required.</p>}
            </div>
            <div>
              <label className="ga-label" htmlFor="ga-name">
                Receiver's full name <i>*</i>
              </label>
              <input id="ga-name" className="pf-input ga-in" value={f.name} onChange={set("name")} />
              {bad("name") && <p className="bx-err">Required.</p>}
            </div>
            <div>
              <label className="ga-label" htmlFor="ga-phone">
                Mobile number <i>*</i>
              </label>
              <div className="ga-phone">
                <span>+91</span>
                <input id="ga-phone" className="pf-input ga-in" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} />
              </div>
              {bad("phone") && <p className="bx-err">Enter a 10-digit number.</p>}
            </div>
          </div>

          {/* Delivery instructions (optional) — Figma: link khulte hi textarea */}
          <button type="button" className="ga-notes-btn" onClick={() => setNotesOpen(!notesOpen)} aria-expanded={notesOpen}>
            Delivery instructions (optional)
          </button>
          {notesOpen && <textarea className="pf-input ga-notes" rows={2} placeholder="E.g. call before delivery, gate code, best time" value={f.notes} onChange={set("notes")} />}

          <label className="pf-label ga-saveas" htmlFor="ga-label">
            Save as
          </label>
          <select id="ga-label" className="pf-input ga-in ga-labelsel" value={f.label} onChange={set("label")}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </select>

          <label className="ga-default">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
            Make this my default address
          </label>

          {tried && !valid && <p className="bx-err">Please fill all required fields.</p>}
          <div className="ga-btns">
            {editId && (
              <button
                type="button"
                className="ga-cancel"
                onClick={() => {
                  setF(EMPTY);
                  setEditId(null);
                  setTried(false);
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="pf-btn ga-save" disabled={busy}>
              {busy ? "Saving…" : editId ? "Update address" : "Save address"}
            </button>
          </div>
          <p className="ga-foot">Your full address is private, used only for campaign logistics you approve — never shown in search or to brands.</p>
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
        .ga-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 0 -20px; padding: 0 20px 12px; border-bottom: 1px solid var(--bx-line); }
        .ga-head h1 { font-family: var(--bx-sans); font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .ga-head span { font-size: 12px; color: #6b5a3a; text-align: right; }
        .ga-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 10px; max-width: 640px; }
        .ga-list li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; border: 1px solid #d9c9a3; background: #fffdf8; }
        .ga-list li.is-default { border-color: var(--bx-teal); }
        .ga-list__pin { width: 30px; height: 30px; flex-shrink: 0; border-radius: 9px; background: #f6e3bd; color: var(--bx-red); display: grid; place-items: center; }
        .ga-list__txt { flex: 1; min-width: 0; }
        .ga-list__txt strong { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }
        .ga-def { font-style: normal; padding: 1px 7px; border-radius: 5px; background: #d3eeec; color: #1f6f69; font-size: 10.5px; font-weight: 700; }
        .ga-list__txt p { margin: 4px 0 0; font-size: 12.5px; color: #6b5a3a; line-height: 1.5; overflow-wrap: anywhere; }
        .ga-list__act { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .ga-list__act button { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-size: 12px; font-weight: 700; }
        .ga-list__act button.is-red { color: var(--bx-red); }
        .ga-form { margin-top: 18px; scroll-margin-top: 90px; max-width: 640px; }
        .ga-form h2 { font-family: var(--bx-sans); font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .ga-label { display: flex; align-items: center; gap: 4px; margin: 0 0 6px; font-size: 13.5px; font-weight: 700; color: var(--bx-ink); }
        .ga-label i { font-style: normal; color: #dc2626; }
        .ga-in { height: 40px; padding: 0 12px; border-radius: 12px; }
        .ga-search { padding: 12px 12px 12px; border-radius: 12px; background: #e9e7d6; border: 1px solid #cfd6bf; }
        .ga-search .ga-label { margin-bottom: 8px; }
        .ga-search .ga-in { height: 44px; padding: 0 14px; }
        .ga-loc { display: inline-flex; align-items: center; gap: 4px; height: 40px; margin-top: 8px; padding: 0 14px; border-radius: 12px; border: 1px solid #c9b88f; background: #fffdf8; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: var(--bx-ink); }
        .ga-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin-top: 18px; }
        .ga-pinbox { max-width: 220px; }
        .ga-full { grid-column: 1 / -1; }
        .ga-pin::placeholder { letter-spacing: 2px; }
        .ga-pin { letter-spacing: 2px; }
        .ga-phone { display: flex; }
        .ga-phone span { display: grid; place-items: center; padding: 0 10px; border: 1px solid #d9c9a3; border-right: 0; border-radius: 12px 0 0 12px; background: #efebe3; font-size: 14px; font-weight: 600; }
        .ga-phone .ga-in { border-radius: 0 12px 12px 0; min-width: 0; }
        .ga-notes-btn { display: block; margin: 14px 12px 0; padding: 0; border: 0; background: none; font-size: 13.5px; font-weight: 700; color: #007185; }
        .ga-notes { margin-top: 8px; }
        .ga-saveas { margin: 12px 0 6px; }
        .ga-labelsel { max-width: 532px; }
        .ga-default { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; font-size: 13px; color: var(--bx-ink); cursor: pointer; }
        .ga-default input { width: 14px; height: 14px; margin: 0; accent-color: var(--bx-green); }
        .ga-btns { display: flex; gap: 10px; margin: 14px 0 0; }
        .ga-save { height: 40px; padding: 0 18px; }
        .ga-cancel { height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid #d9c9a3; background: #fffdf8; font-weight: 700; }
        .ga-foot { margin: 14px 0 0; font-size: 12px; line-height: 1.5; color: #6b5a3a; }
        @media (max-width: 767px) {
          .ga-head { margin: 0 -16px; padding: 0 16px 14px; }
          .ga-head h1 { max-width: 90px; }
          .ga-grid { grid-template-columns: 1fr; }
          .ga-blank { display: none; }
          .ga-pinbox { max-width: none; }
          .ga-list li { flex-wrap: wrap; }
          .ga-list__act { width: 100%; justify-content: flex-start; }
        }
      `}</style>
    </BountyShell>
  );
}
