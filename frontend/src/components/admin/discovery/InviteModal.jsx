"use client";

import { useEffect, useState } from "react";
import { sbFor, rpc, errText } from "@/lib/supabase";

/**
 * Discovery se "Invite →" — purane inviteFromDiscovery jaisa:
 *  campaign chuno (Sourcing / Live / In Production / Approval) + note →
 *  Geek OS creator: invite_creator(p_member) · baaki Instagram creator: invite_external(p_handle)
 * props: who = { handle, member_id, name }, onDone(msg), onClose()
 */
export default function InviteModal({ who, onDone, onClose }) {
  const [camps, setCamps] = useState(null);
  const [cid, setCid] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sbFor("admin")
      .from("campaigns")
      .select("id,name,status")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) return setErr(errText(error));
        const live = (data || []).filter((c) => ["Sourcing", "Live", "In Production", "Approval"].includes(c.status));
        setCamps(live);
        if (live[0]) setCid(live[0].id);
      });
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const args = { p_campaign: cid, p_note: note.trim() || null };
    const r = who.member_id ? await rpc("admin", "api.invite_creator", { ...args, p_member: who.member_id }) : await rpc("admin", "api.invite_external", { ...args, p_handle: who.handle });
    setBusy(false);
    if (r.error) return setErr(errText(r.error));
    onDone(
      who.member_id || (r.data && r.data.on_platform)
        ? "Invite sent — they'll see it in the app, on WhatsApp and by email."
        : "Invite saved. Open the campaign's Outreach to send them the Instagram DM."
    );
  };

  return (
    <div className="ad-overlay" onClick={onClose}>
      <form className="ad-modal im" onClick={(e) => e.stopPropagation()} onSubmit={send} role="dialog" aria-label={`Invite @${who.handle}`}>
        <h3 className="ad-h2">Invite {who.handle ? `@${who.handle}` : who.name}</h3>
        {camps && !camps.length ? (
          <p className="im-note">Create a campaign first — then you can invite creators to it.</p>
        ) : (
          <>
            <label className="ad-label" htmlFor="imCamp">
              Campaign
            </label>
            <select id="imCamp" className="ad-input" value={cid} onChange={(e) => setCid(e.target.value)} disabled={!camps}>
              {!camps && <option>Loading campaigns…</option>}
              {(camps || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="ad-label" htmlFor="imNote">
              Note (optional)
            </label>
            <input id="imNote" className="ad-input" maxLength={140} placeholder="Why you'd love them on this" value={note} onChange={(e) => setNote(e.target.value)} />
          </>
        )}
        {err && <p className="im-err">{err}</p>}
        <div className="im-acts">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="ad-btn ad-btn--primary" disabled={busy || !cid}>
            {busy ? "Sending…" : "Send invite"}
          </button>
        </div>
        <style>{`
          .im { padding: 24px; }
          .im .ad-label { margin-top: 14px; }
          .im-note { margin-top: 12px; font-size: 13.5px; color: var(--ad-muted); }
          .im-err { margin-top: 12px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
          .im-acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        `}</style>
      </form>
    </div>
  );
}
