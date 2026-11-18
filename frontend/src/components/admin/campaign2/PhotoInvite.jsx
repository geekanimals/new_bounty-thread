"use client";

import { useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";

/*
 * 📸 WhatsApp invite with the campaign photo — one message (Snapto template campaign_invite_pic_1) to everyone
 * invited to this campaign who has not joined yet. Count first, Send only after the second click.
 * Each person gets it once (api.snapto_image_invite_once dedupes per invite).
 */
export default function PhotoInvite({ campaignId }) {
  const pre = useRpc("admin", "api.snapto_image_invite_once", { p_campaign: campaignId, p_send: false }, { skip: !campaignId || campaignId === "sample" });
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const d = pre.data || {};
  if (!campaignId || campaignId === "sample") return null;
  const send = async () => {
    setBusy(true);
    setMsg("");
    try {
      const r = await rpc("admin", "api.snapto_image_invite_once", { p_campaign: campaignId, p_send: true });
      setMsg(r && r.ok ? `Queued for ${r.people} creator${r.people === 1 ? "" : "s"} — it goes out within a few minutes.` : (r && r.error) || "Couldn't send.");
      setSure(false);
      pre.reload && pre.reload();
    } catch (e) {
      setMsg(errText(e));
    }
    setBusy(false);
  };
  return (
    <div className="wo-photoinv" style={{ border: "1px solid var(--line, #e5e7eb)", borderRadius: 10, padding: 12, margin: "10px 0" }}>
      <p style={{ margin: 0, fontWeight: 600 }}>📸 WhatsApp invite with photo</p>
      {pre.loading && !pre.data ? (
        <p className="wo-sub">Checking…</p>
      ) : d.ok === false ? (
        <p className="wo-sub">{d.error}</p>
      ) : (
        <>
          <p className="wo-sub" style={{ margin: "4px 0 8px" }}>
            {d.people || 0} invited creator{d.people === 1 ? "" : "s"} have not joined yet and have not had this message
            {d.already_sent ? ` · ${d.already_sent} already got it` : ""}. New invites send the photo drip on their own.
          </p>
          {d.people > 0 &&
            (sure ? (
              <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="ga-btn" disabled={busy} onClick={send}>
                  {busy ? "Sending…" : `Yes, send to ${d.people}`}
                </button>
                <button type="button" className="ga-btn ga-btn--ghost" disabled={busy} onClick={() => setSure(false)}>
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setSure(true)}>
                Send one photo message to {d.people}
              </button>
            ))}
        </>
      )}
      {msg && <p className="wo-sub" style={{ marginTop: 6 }}>{msg}</p>}
    </div>
  );
}
