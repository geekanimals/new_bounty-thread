"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/brand/Drawer";
import Inbox, { InboxHead } from "@/components/admin/msg/Inbox";

/** /admin/inbox/new — New WhatsApp chat (Figma 080) */
export default function NewChat() {
  const router = useRouter();
  const [num, setNum] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => router.push("/admin/inbox"), 1200);
    return () => clearTimeout(t);
  }, [toast, router]);

  const send = (e) => {
    e.preventDefault();
    const digits = num.replace(/\D/g, "");
    if (digits.length < 10) return setErr("Enter a WhatsApp number with 10 digits.");
    if (!msg.trim()) return setErr("Write a message to send.");
    setErr("");
    setToast(`Message sent to ${num.trim()}`);
  };

  return (
    <AdminShell>
      <InboxHead />
      <Inbox />
      <Drawer closeHref="/admin/inbox" width={620} label="New WhatsApp chat">
        <form className="nc" onSubmit={send}>
          <p className="nc-eye">Messages</p>
          <h2>New WhatsApp chat</h2>
          <p className="nc-sub">Start a chat with any number.</p>
          <div className="nc-grid">
            <div>
              <label className="nc-l" htmlFor="nc-num">
                WhatsApp number
              </label>
              <input id="nc-num" className="ad-input nc-in" inputMode="tel" placeholder="+91 98765 43210" value={num} onChange={(e) => setNum(e.target.value)} />
            </div>
            <div>
              <label className="nc-l" htmlFor="nc-msg">
                Message
              </label>
              <textarea id="nc-msg" className="ad-input nc-in nc-ta" placeholder="Write your message" value={msg} onChange={(e) => setMsg(e.target.value)} />
            </div>
          </div>
          <p className="nc-note">
            <span>ℹ️</span> Outside the 24-hour window WhatsApp needs a pre-approved template for the first message.
          </p>
          {err && <p className="nc-err">{err}</p>}
          <div className="nc-act">
            <button type="submit" className="ad-btn ad-btn--primary" disabled={!!toast}>
              Send
            </button>
          </div>
        </form>
      </Drawer>
      {toast && <div className="ad-toast">✓ {toast}</div>}
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
        .nc-note { display: flex; gap: 10px; margin-top: 18px; padding: 12px 15px; border-radius: 13px; border: 1px solid #f6dfb5; background: #fff6e6; font-size: 12px; line-height: 1.35; color: #986016; }
        .nc-err { margin-top: 12px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .nc-act { margin-top: 16px; }
        .nc-act .ad-btn { height: 41px; padding: 0 16px; }
        @media (max-width: 560px) { .nc-grid { grid-template-columns: 1fr; } .nc h2 { margin-top: 14px; } }
      `}</style>
    </AdminShell>
  );
}
