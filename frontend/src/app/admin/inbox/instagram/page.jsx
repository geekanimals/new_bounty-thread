"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { InboxHead } from "@/components/admin/msg/Inbox";

const DMS = [
  { av: "N", name: "@nishastories", text: "Loved the Beardo kit! Reel goes live tomorrow 🙌", ago: "8m" },
  { av: "K", name: "@kabirfoodtrail", text: "Can I tag Olio in a story too?", ago: "1h" },
  { av: "A", name: "@ananya.travels", text: "Thanks for the invite — interested!", ago: "4h" },
];

/** /admin/inbox/instagram — Instagram DMs (Figma 079) */
export default function InstagramDMs() {
  const [state, setState] = useState("off"); // off | busy | on
  const [reply, setReply] = useState({});
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const connect = () => {
    setState("busy");
    setTimeout(() => setState("on"), 1100);
  };

  return (
    <AdminShell>
      <InboxHead />
      <section className="ad-card ig-card">
        <h2 className="ad-h2">📸 Instagram DMs</h2>
        <p className="ig-sub">Connect your Instagram and your DMs open right here — reply to creators without leaving Geek OS. Invites you send also go out from this handle.</p>
        {state !== "on" ? (
          <div className="ig-cta">
            <button type="button" className="ad-btn ad-btn--primary" onClick={connect} disabled={state === "busy"}>
              {state === "busy" ? "Connecting…" : "📸 Connect Instagram"}
            </button>
          </div>
        ) : (
          <div className="ig-list">
            <p className="ig-ok">● Connected as @geekcreativeagency</p>
            {DMS.map((d) => (
              <div key={d.name} className="ig-dm">
                <span className="ig-av">{d.av}</span>
                <div className="ig-dm__main">
                  <p>
                    <b>{d.name}</b> <em>· {d.ago}</em>
                  </p>
                  <p className="ig-dm__t">{d.text}</p>
                  <form
                    className="ig-reply"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!(reply[d.name] || "").trim()) return;
                      setReply({ ...reply, [d.name]: "" });
                      setToast(`Reply sent to ${d.name}`);
                    }}
                  >
                    <input className="ad-input" placeholder="Reply…" value={reply[d.name] || ""} onChange={(e) => setReply({ ...reply, [d.name]: e.target.value })} aria-label={`Reply to ${d.name}`} />
                    <button type="submit" className="ad-btn ad-btn--soft">
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {toast && <div className="ad-toast">✓ {toast}</div>}
      <style>{`
        .ig-card { padding: 24px 22px 52px; }
        .ig-sub { margin-top: 9px; font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
        .ig-cta { display: flex; justify-content: center; margin-top: 46px; }
        .ig-cta .ad-btn { height: 41px; padding: 0 16px; }
        .ig-list { margin-top: 22px; display: grid; gap: 10px; }
        .ig-ok { font-size: 12px; font-weight: 700; color: var(--ad-green); }
        .ig-dm { display: flex; gap: 14px; padding: 14px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .ig-av { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 17px; }
        .ig-dm__main { flex: 1; min-width: 0; font-size: 14px; }
        .ig-dm__main b { font-weight: 700; }
        .ig-dm__main em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--ad-muted); }
        .ig-dm__t { margin-top: 4px; font-size: 13px; color: var(--ad-text); }
        .ig-reply { display: flex; gap: 8px; margin-top: 10px; }
        .ig-reply .ad-input { height: 38px; }
        .ig-reply .ad-btn { height: 38px; }
        @media (max-width: 640px) { .ig-card { padding: 18px 16px 30px; } .ig-cta { margin-top: 26px; } }
      `}</style>
    </AdminShell>
  );
}
