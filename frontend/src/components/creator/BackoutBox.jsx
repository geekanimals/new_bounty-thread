"use client";

import { useState } from "react";
import { useRpc } from "@/lib/supabase";
import Link from "next/link";
import { requestBackout, cancelBackout, shipBackout, fdate } from "@/services/creator";

/*
 * Backout / return product — creator side.
 *  - useBackout(P): api.my_backout (request + can_request + kind + reasons)
 *  - <BackoutCard>: status card (asked / approved + return address / shipped / returned / declined)
 *  - <BackoutAsk>: "Can't continue with this campaign?" form (reason + note)
 * Post live ho gaya to option hi nahi dikhta (server bhi rokta hai).
 */
export function useBackout(P) {
  const r = useRpc("creator", "api.my_backout", { p_participation: P }, { skip: !P });
  return { data: r.error ? null : r.data, loading: r.loading, reload: () => r.reload(true) };
}

const errMsg = (e) => String((e && (e.message || e)) || "Something went wrong").replace(/^.*?:\s(?=[A-Z])/, "");

/** request khula / approved / shipped / returned → yeh card (overview ka main card iske baad) */
export function BackoutCard({ bo, onChange }) {
  const r = bo && bo.data && bo.data.request;
  const [f, setF] = useState({ courier: "", tracking: "", url: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!r || !["requested", "approved", "shipped", "returned"].includes(r.status)) return null;

  const ship = async () => {
    if (!f.courier.trim()) return setErr("Add the courier name.");
    if (!f.tracking.trim()) return setErr("Add the tracking number.");
    setBusy(true);
    setErr("");
    const x = await shipBackout(r.id, f.courier.trim(), f.tracking.trim(), f.url.trim());
    setBusy(false);
    if (x.error) return setErr(errMsg(x.error));
    onChange && onChange();
  };
  const cancel = async () => {
    if (!window.confirm("Cancel your request and continue with the campaign?")) return;
    setBusy(true);
    const x = await cancelBackout(r.id);
    setBusy(false);
    if (x.error) return setErr(errMsg(x.error));
    onChange && onChange();
  };

  if (r.status === "requested")
    return (
      <div className="bo">
        <span className="ts-ic">⏳</span>
        <h2>Request sent</h2>
        <p>
          You asked to leave this campaign — <b>{r.reason_note || r.reason_label}</b>. Our team will get in touch with you shortly.
        </p>
        <button type="button" className="bx-btn bx-btn--ghost" disabled={busy} onClick={cancel}>
          {busy ? "…" : "Cancel request — I'll continue"}
        </button>
        {err && <p className="ts-err">{err}</p>}
        <style>{BO_CSS}</style>
      </div>
    );

  if (r.kind === "withdraw")
    return (
      <div className="bo">
        <span className="ts-ic">👋</span>
        <h2>You have left this campaign</h2>
        <p>Your request was approved{r.decided_at ? ` on ${fdate(r.decided_at)}` : ""}. Thank you for letting us know.</p>
        {r.admin_note && <p className="bo-note">Note from the team: {r.admin_note}</p>}
        <Link href="/creator/discover" className="bx-btn bx-btn--dark">
          Find other campaigns →
        </Link>
        <style>{BO_CSS}</style>
      </div>
    );

  if (r.status === "returned")
    return (
      <div className="bo">
        <span className="ts-ic">✅</span>
        <h2>Product received back</h2>
        <p>We received the product{r.returned_at ? ` on ${fdate(r.returned_at)}` : ""}. Your return is complete — thank you.</p>
        <Link href="/creator/discover" className="bx-btn bx-btn--dark">
          Find other campaigns →
        </Link>
        <style>{BO_CSS}</style>
      </div>
    );

  return (
    <div className="bo">
      <span className={`ts-ic ${r.overdue ? "ts-ic--red" : "ts-ic--gold"}`}>📦</span>
      <h2>{r.status === "shipped" ? "Return on the way" : "Please return the product"}</h2>
      {r.status === "approved" ? (
        <p>
          Your request to leave was approved and you are no longer on this campaign. Please send the product back by <b>{fdate(r.return_by)}</b>
          {r.overdue ? " — this is now overdue" : ""}.
        </p>
      ) : (
        <p>
          You sent it with <b>{r.courier}</b> · tracking <b>{r.tracking}</b>. We’ll confirm once it reaches us.
        </p>
      )}
      <div className="bo-addr">
        <p className="bo-k">Send it to</p>
        <p className="bo-v">{r.return_address}</p>
      </div>
      {r.admin_note && <p className="bo-note">Note from the team: {r.admin_note}</p>}
      {r.status === "approved" && (
        <div className="bo-form">
          <p className="bo-k">Sent it? Add the details</p>
          <label className="bx-label" htmlFor="bo-c">
            Courier name
          </label>
          <input id="bo-c" className="bx-input" value={f.courier} placeholder="e.g. Delhivery, India Post" onChange={(e) => setF({ ...f, courier: e.target.value })} />
          <label className="bx-label" htmlFor="bo-t">
            Tracking number
          </label>
          <input id="bo-t" className="bx-input" value={f.tracking} onChange={(e) => setF({ ...f, tracking: e.target.value })} />
          <label className="bx-label" htmlFor="bo-u">
            Tracking link (optional)
          </label>
          <input id="bo-u" className="bx-input" value={f.url} placeholder="https://" onChange={(e) => setF({ ...f, url: e.target.value })} />
          <button type="button" className="bx-btn bx-btn--dark bx-btn--lg" disabled={busy} onClick={ship}>
            {busy ? "Saving…" : "📮 I’ve sent it back"}
          </button>
          {err && <p className="ts-err">{err}</p>}
        </div>
      )}
      {r.status === "shipped" && r.tracking_url && (
        <a href={r.tracking_url} target="_blank" rel="noopener noreferrer" className="bx-btn bx-btn--ghost">
          Track it ↗
        </a>
      )}
      <style>{BO_CSS}</style>
    </div>
  );
}

/** "Can't continue?" — campaign overview ke neeche, sirf post live hone se pehle */
export function BackoutAsk({ P, bo, onChange }) {
  const d = (bo && bo.data) || {};
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!d.can_request) return null;
  const reasons = d.reasons || [];
  const send = async () => {
    if (!code) return setErr("Pick a reason.");
    if (code === "other" && !note.trim()) return setErr("Please write the reason.");
    setBusy(true);
    setErr("");
    const r = await requestBackout(P, code, note.trim());
    setBusy(false);
    if (r.error) return setErr(errMsg(r.error));
    setOpen(false);
    onChange && onChange();
  };
  return (
    <div className="bo-ask">
      {!open ? (
        <button type="button" className="bo-link" onClick={() => setOpen(true)}>
          Can’t continue with this campaign?
        </button>
      ) : (
        <div className="bo-askbox">
          <h3>Leave this campaign</h3>
          <p>
            {d.kind === "return"
              ? "Tell us why. Our team will talk to you, and once it’s approved you’ll need to send the product back."
              : "Tell us why. Our team will review it and let you know."}
          </p>
          <div className="bo-chips">
            {reasons.map((r) => (
              <button key={r.code} type="button" className={`bo-chip ${code === r.code ? "is-on" : ""}`} onClick={() => setCode(r.code)}>
                {r.label}
              </button>
            ))}
          </div>
          <label className="bx-label" htmlFor="bo-n">
            {code === "other" ? "Your reason" : "Anything else? (optional)"}
          </label>
          <textarea id="bo-n" className="bx-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="bo-btns">
            <button type="button" className="bx-btn bx-btn--dark" disabled={busy} onClick={send}>
              {busy ? "Sending…" : "Send request"}
            </button>
            <button type="button" className="bx-btn bx-btn--ghost" onClick={() => (setOpen(false), setErr(""))}>
              Cancel
            </button>
          </div>
          {err && <p className="ts-err">{err}</p>}
        </div>
      )}
      <style>{BO_CSS}</style>
    </div>
  );
}

const BO_CSS = `
  .bo-addr { margin: 10px 0; padding: 10px 12px; border-radius: 12px; background: #fff; border: 1px solid var(--bx-line); }
  .bo-k { margin: 0 0 3px; font-size: 11.5px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8a6b32; }
  .bo-v { margin: 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap; color: #14231a; }
  .bo-note { margin: 8px 0; padding: 8px 10px; border-radius: 10px; background: #fbe7b5; font-size: 13px; line-height: 1.5; }
  .bo-form { margin-top: 12px; display: grid; gap: 6px; }
  .bo-ask { margin-top: 18px; text-align: center; }
  .bo-link { border: 0; background: none; font-size: 13px; font-weight: 600; color: var(--bx-muted); text-decoration: underline; cursor: pointer; }
  .bo-askbox { text-align: left; padding: 14px; border-radius: 12px; background: #fff; border: 1px solid var(--bx-line); }
  .bo-askbox h3 { margin: 0 0 4px; font-family: var(--bx-serif); font-size: 17px; }
  .bo-askbox p { margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: var(--bx-muted); }
  .bo-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .bo-chip { padding: 7px 11px; border-radius: 999px; border: 1px solid var(--bx-line); background: #fff; font-size: 12.5px; cursor: pointer; }
  .bo-chip.is-on { border-color: #14231a; background: #14231a; color: #fff; font-weight: 700; }
  .bo-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
`;
