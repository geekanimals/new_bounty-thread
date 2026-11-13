"use client";

import { useEffect, useState } from "react";
import BountyShell from "@/components/creator/BountyShell";
import TrackerFrame, { useTracker, TrackerWait, StepMismatch } from "@/components/creator/TrackerSteps";
import { getMyProfile, confirmAddress, geoLookup, saveCampaignAddress, INDIA_STATES, canonState, phone10 } from "@/services/creator";
import { Pin } from "@/components/ui/Icons";

const lineOf = (a) => [a.line1, a.line2, a.landmark, a.city, a.state, a.postal_code].filter(Boolean).join(", ");
// courier ke liye poora address (purane complete())
const complete = (x) => !!(x && x.recipient_name && x.recipient_phone && x.line1 && x.line2 && x.landmark && x.city && x.state && /^[1-9]\d{5}$/.test(x.postal_code || ""));

/**
 * /creator/my-campaigns/[id]/address — purane openAddressModal jaisa:
 * saved address chuno (api.get_my_profile) → api.confirm_campaign_address; ya naya / edit → api.upsert_address + confirm.
 * PIN code se city / state (geo-lookup function, purane jaisa).
 */
export default function AddressStep() {
  const t = useTracker();
  const [addrs, setAddrs] = useState(null);
  const [who, setWho] = useState({ name: "", phone: "" });
  const [sel, setSel] = useState("");
  const [editing, setEditing] = useState(null); // null = list; {} = naya; address = edit
  const [f, setF] = useState({});
  const [pinMsg, setPinMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getMyProfile().then((r) => {
      if (!alive) return;
      const prof = !r.error ? r.data : null;
      const list = (prof && prof.addresses) || [];
      const pe = (prof && prof.personal) || {};
      const ct = (prof && prof.contact) || {};
      setWho({ name: [pe.first_name, pe.last_name].filter(Boolean).join(" "), phone: ct.whatsapp_e164 || ct.phone_e164 || "" });
      setAddrs(list);
      const d = list.find((x) => x.is_default) || list[0];
      if (d) setSel(d.address_id);
      if (!list.length) setEditing({});
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (editing === null) return;
    const a = editing || {};
    setF({
      name: a.recipient_name || who.name || "",
      phone: phone10(a.recipient_phone || who.phone || ""),
      pin: a.postal_code || "",
      l1: a.line1 || "",
      l2: a.line2 || "",
      lm: a.landmark || "",
      city: a.city || "",
      state: canonState(a.state) || a.state || "",
      di: a.delivery_instructions || "",
    });
    setPinMsg("");
    setErr("");
  }, [editing, who]);

  if (!t.m)
    return (
      <BountyShell>
        <TrackerWait t={t} />
      </BountyShell>
    );
  const { c } = t;
  const P = t.m.participation_id;
  const onStep = t.step === "address" && t.m.stage === "contract_signed";
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const done = async () => {
    await t.reload();
  };

  const confirmSaved = async () => {
    setErr("");
    const picked = (addrs || []).find((x) => x.address_id === sel);
    if (!picked) return setErr("Pick an address.");
    if (!complete(picked)) {
      setEditing(picked);
      setErr("This address needs a few more details for the courier — fill them in and save.");
      return;
    }
    setBusy(true);
    const r = await confirmAddress(P, sel);
    setBusy(false);
    if (r.error) return setErr(r.error.message || String(r.error));
    done();
  };

  // PIN → city/state (geo-lookup)
  const onPin = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setF((x) => ({ ...x, pin }));
    if (pin.length < 6) return setPinMsg(pin.length ? "Enter all 6 digits" : "");
    if (!/^[1-9]/.test(pin)) return setPinMsg("⚠ A PIN code can't start with 0");
    setPinMsg("Checking PIN code…");
    const { data: r, error } = await geoLookup({ action: "pincode", pin });
    if (error || !r) return setPinMsg("Couldn't check the PIN right now — please fill the city and state yourself.");
    if (r.ok) {
      setF((x) => ({ ...x, state: canonState(r.state) || x.state, city: x.city || r.city || r.district || "" }));
      setPinMsg("✓ " + [r.city || r.district, r.state].filter(Boolean).join(", "));
    } else if (r.down) setPinMsg("Couldn't check the PIN right now — please fill the city and state yourself.");
    else setPinMsg("⚠ " + (r.error || "We couldn't find this PIN code — please check it"));
  };

  const saveNew = async () => {
    setErr("");
    const miss = [];
    if (f.name.trim().split(/\s+/).filter(Boolean).length < 2) miss.push("full name (first and last)");
    if (!/^[6-9]\d{9}$/.test(phone10(f.phone))) miss.push("a 10-digit mobile number");
    if (!/^[1-9]\d{5}$/.test(f.pin)) miss.push("a 6-digit PIN code");
    if (f.l1.trim().length < 2) miss.push("flat / house no.");
    if (f.l2.trim().length < 3) miss.push("area / street");
    if (f.lm.trim().length < 3) miss.push("landmark");
    if (f.city.trim().length < 2) miss.push("town / city");
    if (!f.state) miss.push("state");
    if (miss.length) return setErr("Please add " + miss.join(", ") + ".");
    const payload = {
      recipient_name: f.name.trim(),
      recipient_phone: "+91" + phone10(f.phone),
      line1: f.l1.trim(),
      line2: f.l2.trim(),
      landmark: f.lm.trim(),
      city: f.city.trim(),
      state: f.state,
      postal_code: f.pin,
      country: "India",
      delivery_instructions: f.di.trim() || null,
      lat: null,
      lng: null,
      map_verified: false,
      label: (editing && editing.label) || "Home",
      is_default: editing && editing.address_id ? !!editing.is_default : true,
    };
    if (editing && editing.address_id) payload.address_id = editing.address_id;
    setBusy(true);
    const r1 = await saveCampaignAddress(payload);
    if (r1.error) {
      setBusy(false);
      return setErr(r1.error.message || String(r1.error));
    }
    const aid = (r1.data && r1.data.address_id) || r1.data || (editing && editing.address_id);
    const r2 = await confirmAddress(P, aid);
    setBusy(false);
    if (r2.error) return setErr(r2.error.message || String(r2.error));
    done();
  };

  const body = () => {
    if (!onStep) return <StepMismatch t={t} />;
    if (addrs === null)
      return (
        <>
          <span className="ts-ic">📍</span>
          <h2>Where should {c.brand} send your kit?</h2>
          <p>Loading your addresses…</p>
        </>
      );
    if (editing !== null)
      return (
        <>
          <span className="ts-ic">📍</span>
          <h2>{editing.address_id ? "Edit address" : "Add a new address"}</h2>
          {addrs.length > 0 && (
            <button type="button" className="ts-link ga-back" onClick={() => setEditing(null)}>
              ← Saved addresses
            </button>
          )}
          <div className="ga-form">
            <label className="ga-f ga-f--wide">
              <span>Full name *</span>
              <input className="bx-input" autoComplete="name" value={f.name || ""} onChange={set("name")} />
            </label>
            <label className="ga-f">
              <span>Mobile number *</span>
              <input className="bx-input" inputMode="tel" autoComplete="tel" maxLength={14} value={f.phone || ""} onChange={set("phone")} placeholder="10-digit number" />
            </label>
            <label className="ga-f">
              <span>PIN code *</span>
              <input className="bx-input" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={f.pin || ""} onChange={onPin} placeholder="6-digit PIN" />
              {pinMsg && <small className="ga-pin">{pinMsg}</small>}
            </label>
            <label className="ga-f ga-f--wide">
              <span>Flat / house no., building *</span>
              <input className="bx-input" autoComplete="address-line1" value={f.l1 || ""} onChange={set("l1")} />
            </label>
            <label className="ga-f ga-f--wide">
              <span>Area / street / sector *</span>
              <input className="bx-input" autoComplete="address-line2" value={f.l2 || ""} onChange={set("l2")} />
            </label>
            <label className="ga-f ga-f--wide">
              <span>Landmark *</span>
              <input className="bx-input" value={f.lm || ""} onChange={set("lm")} placeholder="Near…" />
            </label>
            <label className="ga-f">
              <span>Town / city *</span>
              <input className="bx-input" autoComplete="address-level2" value={f.city || ""} onChange={set("city")} />
            </label>
            <label className="ga-f">
              <span>State *</span>
              <select className="bx-input" value={f.state || ""} onChange={set("state")}>
                <option value="">Choose a state</option>
                {INDIA_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="ga-f ga-f--wide">
              <span>Delivery instructions (optional)</span>
              <input className="bx-input" value={f.di || ""} onChange={set("di")} />
            </label>
          </div>
          {err && <p className="ts-err">{err}</p>}
          <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={busy} onClick={saveNew}>
            {busy ? "Saving…" : "Save & ship here →"}
          </button>
        </>
      );
    return (
      <>
        <span className="ts-ic">📍</span>
        <h2>Where should {c.brand} send your kit?</h2>
        <div className="ga-list">
          {addrs.map((a) => {
            const ok = complete(a);
            return (
              <label key={a.address_id} className={`${sel === a.address_id ? "is-on" : ""} ${ok ? "" : "is-inc"}`}>
                <input type="radio" name="addr" checked={sel === a.address_id} onChange={() => setSel(a.address_id)} />
                <span>
                  <strong>
                    <Pin size={12} /> {a.label || "Address"} {a.is_default && <em>Default</em>} {!ok && <em className="ga-warn">Needs a few details</em>}
                  </strong>
                  {a.recipient_name && (
                    <small>
                      {a.recipient_name} · {a.recipient_phone}
                    </small>
                  )}
                  <small>{lineOf(a)}</small>
                </span>
                <button
                  type="button"
                  className="ga-edit"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditing(a);
                  }}
                >
                  Edit
                </button>
              </label>
            );
          })}
        </div>
        <button type="button" className="ts-link ga-back" onClick={() => setEditing({})}>
          + Add a new address
        </button>
        {err && <p className="ts-err">{err}</p>}
        <div>
          <button type="button" className="bx-btn bx-btn--dark ts-mt" disabled={busy} onClick={confirmSaved}>
            {busy ? "Confirming…" : "Confirm delivery address →"}
          </button>
        </div>
      </>
    );
  };

  return (
    <BountyShell>
      <title>{`Delivery address — ${c.title} — Bounty`}</title>
      <TrackerFrame t={t} step={onStep ? "address" : undefined}>
        {body()}
      </TrackerFrame>
      <style>{`
        .ga-list { display: grid; gap: 10px; margin-top: 12px; }
        .ga-list label { display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--bx-line); background: #fffaf0; cursor: pointer; }
        .ga-list label.is-on { border-color: var(--bx-teal); box-shadow: 0 0 0 3px rgba(46,156,148,.15); }
        .ga-list label > span { flex: 1; min-width: 0; }
        .ga-list input { accent-color: var(--bx-teal); margin-top: 3px; }
        .ga-list strong { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 13.5px; }
        .ga-list strong em { padding: 1px 7px; border-radius: 999px; background: var(--bx-ok-bg); font-style: normal; font-size: 10.5px; font-weight: 700; color: var(--bx-ok); }
        .ga-list strong em.ga-warn { background: #fbe7b5; color: #8a5d14; }
        .ga-list small { display: block; font-size: 12.5px; color: var(--bx-text); overflow-wrap: anywhere; }
        .ga-edit { align-self: flex-start; border: 1px solid var(--bx-line); border-radius: 999px; background: #fff; padding: 4px 10px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
        .ga-back { border: 0; background: none; padding: 0; cursor: pointer; }
        .ga-form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; margin-top: 12px; }
        .ga-f { display: grid; gap: 4px; min-width: 0; }
        .ga-f span { font-size: 12px; font-weight: 700; color: #14231a; }
        .ga-f--wide { grid-column: 1 / -1; }
        .ga-pin { font-size: 11.5px; color: var(--bx-text); }
        @media (max-width: 640px) { .ga-form { grid-template-columns: 1fr; } }
      `}</style>
    </BountyShell>
  );
}
