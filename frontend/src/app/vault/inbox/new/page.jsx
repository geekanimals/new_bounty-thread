"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/brand/Drawer";
import Inbox, { InboxHead } from "@/components/admin/msg/Inbox";
import { invoke, errText } from "@/lib/supabase";

/**
 * /vault/inbox/new — New WhatsApp chat (Figma 080) · edge function wa-send (purane whatsapp.js jaisa)
 * 24 ghante se baat nahi hui → WhatsApp approved template maangta hai → template + variables wale fields khulte hain.
 */
export default function NewChat() {
  const router = useRouter();
  const [num, setNum] = useState("");
  const [msg, setMsg] = useState("");
  const [tplOn, setTplOn] = useState(false);
  const [tpl, setTpl] = useState("");
  const [vars, setVars] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [goTo, setGoTo] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => router.push(goTo || "/vault/inbox"), 1200);
    return () => clearTimeout(t);
  }, [toast, goTo, router]);

  const send = async (e) => {
    e.preventDefault();
    const phone = num.trim();
    if (!/^\+?[0-9 \-]{10,}$/.test(phone)) return setErr("Enter a WhatsApp number with 10 digits.");
    const t = tpl.trim();
    if (!msg.trim() && !t) return setErr("Write a message to send.");
    setErr("");
    setBusy(true);
    const body = t ? { to_phone: phone, template: t, variables: vars.split(",").map((v) => v.trim()).filter(Boolean) } : { to_phone: phone, text: msg.trim() };
    const r = await invoke("admin", "wa-send", body);
    setBusy(false);
    if (r.error) {
      const m = errText(r.error);
      if (/24-hour/.test(m)) {
        setTplOn(true);
        return setErr("This number hasn’t messaged you in 24h — send an approved template first.");
      }
      return setErr(`Couldn’t send: ${m}`);
    }
    if (r.data?.conversation_id) setGoTo(`/vault/inbox/chat/${r.data.conversation_id}`);
    setToast(`Message sent to ${phone}`);
  };

  return (
    <AdminShell>
      <InboxHead />
      <Inbox />
      <Drawer closeHref="/vault/inbox" width={620} label="New WhatsApp chat">
        <form className="nc" onSubmit={send}>
          <p className="nc-eye">Messages</p>
          <h2>New WhatsApp chat</h2>
          <p className="nc-sub">Start a chat with any number.</p>
          <div className="nc-grid">
            <div>
              <label className="nc-l" htmlFor="nc-num">
                WhatsApp number
              </label>
              <input id="nc-num" className="ga-input nc-in" inputMode="tel" placeholder="+91 98765 43210" value={num} onChange={(e) => setNum(e.target.value)} />
            </div>
            <div>
              <label className="nc-l" htmlFor="nc-msg">
                Message
              </label>
              <textarea id="nc-msg" className="ga-input nc-in nc-ta" placeholder="Write your message" value={msg} onChange={(e) => setMsg(e.target.value)} />
            </div>
          </div>
          {tplOn && (
            <div className="nc-grid nc-tpl">
              <div>
                <label className="nc-l" htmlFor="nc-tpl">
                  Approved template name
                </label>
                <input id="nc-tpl" className="ga-input nc-in" placeholder="campaign_update" value={tpl} onChange={(e) => setTpl(e.target.value)} />
              </div>
              <div>
                <label className="nc-l" htmlFor="nc-vars">
                  Template variables (comma-separated, in order)
                </label>
                <input id="nc-vars" className="ga-input nc-in" placeholder="Priya, Summer Glow" value={vars} onChange={(e) => setVars(e.target.value)} />
              </div>
            </div>
          )}
          <p className="nc-note">
            <span>ℹ️</span> Outside the 24-hour window WhatsApp needs a pre-approved template for the first message.
          </p>
          {err && <p className="nc-err">{err}</p>}
          <div className="nc-act">
            <button type="submit" className="ga-btn ga-btn--primary" disabled={!!toast || busy}>
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </Drawer>
      {toast && <div className="ga-toast">✓ {toast}</div>}
      <style>{`
        .nc { padding-bottom: 18px; border-bottom: 1px solid var(--ad-line); }
        .nc-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .nc h2 { margin-top: 26px; font-family: var(--ad-head); font-size: 25px; font-weight: 800; letter-spacing: -0.9px; line-height: 1.3; color: var(--ad-ink); }
        .nc-sub { margin-top: 18px; font-size: 12px; color: var(--ad-muted); }
        .nc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 30px; }
        .nc-l { display: block; margin-bottom: 9px; font-size: 12px; font-weight: 800; color: #60708c; }
        .nc-in { height: 42px; font-size: 12px; font-weight: 800; }
        .nc-in::placeholder { color: #757575; }
        .nc-ta { height: 90px; min-height: 90px; resize: vertical; }
        .nc-tpl { margin-top: 16px; }
        .nc-note { display: flex; gap: 10px; margin-top: 18px; padding: 12px 15px; border-radius: 13px; border: 1px solid #f6dfb5; background: #fff6e6; font-size: 12px; line-height: 1.35; color: #986016; }
        .nc-err { margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .nc-act { margin-top: 16px; }
        .nc-act .ga-btn { height: 41px; padding: 0 16px; }
        @media (max-width: 560px) { .nc-grid { grid-template-columns: 1fr; } .nc h2 { margin-top: 14px; } }
      `}</style>
    </AdminShell>
  );
}
