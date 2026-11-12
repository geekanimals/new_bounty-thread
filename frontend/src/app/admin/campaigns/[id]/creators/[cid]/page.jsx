"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";
import { CreatorRow, JOURNEY_STEPS, wsCreator } from "@/components/admin/campaign/journey";

const CHAT = [
  { me: false, t: "Okay, payment by when?", at: "06:22 pm" },
  { me: false, t: "Story too?", at: "06:23 pm" },
  { me: false, t: "Hey good morning — please let me know once payment is done.\nThank you!", at: "06:24 pm" },
  { me: true, t: "Payment goes out once your reel is live 🙌", at: "06:57 pm" },
];

/* Figma: Campaign workspace — creator opened (chat + details + actions) */
export default function WorkspaceCreator() {
  const { id, cid } = useParams();
  const router = useRouter();
  const c = campaignById(id);
  const x = wsCreator(cid);
  const [msgs, setMsgs] = useState(CHAT);
  const [text, setText] = useState("");
  const [step, setStep] = useState(String(Math.max(x.step, 11)));
  const [paused, setPaused] = useState(false);
  const [ask, setAsk] = useState(false);
  const [toast, setToast] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [msgs]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const d = new Date();
    const at = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
    setMsgs((m) => [...m, { me: true, t: text.trim(), at }]);
    setText("");
  };

  return (
    <AdminShell>
      <WorkspaceHead id={c.id} />

      <section className="ad-card wcc">
        <div className="wcc-top">
          <Link href={`/admin/campaigns/${c.id}/creators`} className="wcc-back" aria-label="Back to all creators">
            ←
          </Link>
          <h2 className="ad-h2">Creators · 66</h2>
        </div>
        <CreatorRow c={x} open onAction={() => setToast(`${x.action.replace(/^\S+\s/, "")} — sent to ${x.name}`)} onChat={() => document.getElementById("wcc-msg")?.focus()} />

        <div className="wcc-grid">
          {/* WhatsApp chat */}
          <div className="wcc-chat">
            <div className="wcc-chat__head">
              <b>
                {x.name} · {x.phone}
              </b>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="wcc-open">
                Open in WhatsApp ↗
              </a>
            </div>
            <div className="wcc-msgs">
              {msgs.map((m, i) => (
                <div key={i} className={`wcc-msg ${m.me ? "is-me" : ""}`}>
                  <p>{m.t}</p>
                  <small>
                    {m.at}
                    {m.me && " ✓✓"}
                  </small>
                </div>
              ))}
              <span ref={endRef} />
            </div>
            <form className="wcc-send" onSubmit={send}>
              <input id="wcc-msg" className="ad-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message — goes as a WhatsApp update" aria-label="Message" />
              <button type="submit" className="ad-btn ad-btn--primary" aria-label="Send" disabled={!text.trim()}>
                ➤
              </button>
            </form>
            <p className="wcc-note">They haven’t replied in 24 h — your message goes inside the approved “campaign update” template.</p>
          </div>

          <div className="wcc-side">
            <div className="wcc-box">
              <h3 className="ad-h2">Details</h3>
              <div className="wcc-details">
                <div>
                  <p>WhatsApp</p>
                  <b>{x.phone} · ON</b>
                </div>
                <div>
                  <p>City</p>
                  <b>{x.city}</b>
                </div>
                <div>
                  <p>Video</p>
                  <b>
                    <Link href={`/admin/campaigns/${c.id}/content`}>open ↗</Link>
                  </b>
                </div>
                <div>
                  <p>Next</p>
                  <b>{x.next}</b>
                </div>
              </div>
            </div>

            <div className="wcc-box">
              <h3 className="ad-h2">Actions</h3>
              <label className="wcc-move">
                <span>Move to</span>
                <select className="ad-input" value={step} onChange={(e) => (setStep(e.target.value), setToast(`Moved to step ${e.target.value}. ${JOURNEY_STEPS[e.target.value]}`))}>
                  {JOURNEY_STEPS.map((s, i) =>
                    i ? (
                      <option key={s} value={i}>
                        {i}. {s}
                      </option>
                    ) : null
                  )}
                </select>
              </label>
              <div className="wcc-btns">
                <Link href={`/admin/campaigns/${c.id}/content`} className="wcc-btn">
                  ➕ Add post / story + numbers
                </Link>
                <Link href="/admin/creators/kabir-mehta/instagram" className="wcc-btn">
                  📊 Instagram analytics
                </Link>
                <Link href={`/admin/campaigns/${c.id}/fulfilment`} className="wcc-btn">
                  🔗 Links / courier
                </Link>
              </div>
              <div className="wcc-links">
                <button type="button" onClick={() => (setPaused(!paused), setToast(paused ? "Messages resumed" : "Messages paused for this creator"))}>
                  {paused ? "▶ Resume messages" : "⏸ Pause messages"}
                </button>
                <button type="button" onClick={() => setAsk(true)}>
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {ask && (
        <div className="ad-overlay" onClick={() => setAsk(false)}>
          <div className="ad-modal wcc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Remove creator">
            <h2 className="ad-h2">Remove {x.name} from this campaign?</h2>
            <p>Their chat and history stay in the activity log.</p>
            <div className="wcc-modal__act">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={() => router.push(`/admin/campaigns/${c.id}/creators`)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ad-input { appearance: none; -webkit-appearance: none; }
        .wcc { padding: 22px 22px 40px; }
        .wcc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .wcc-back { display: none; }
        .wcc-grid { display: grid; grid-template-columns: minmax(0, 625fr) minmax(0, 432fr); gap: 18px; margin-top: 13px; align-items: start; }

        .wcc-chat { overflow: hidden; border-radius: 16px; border: 1px solid var(--ad-line); background: #fff; }
        .wcc-chat__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 65px; padding: 0 16px; background: #0d5c4a; }
        .wcc-chat__head b { font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wcc-open { flex-shrink: 0; height: 41px; display: inline-flex; align-items: center; padding: 0 15px; border-radius: 10px; background: #fff; font-size: 14px; font-weight: 800; color: var(--ad-primary-ink); }
        .wcc-msgs { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; padding: 13px 14px 14px; background: #f3f0e8; }
        .wcc-msg { align-self: flex-start; width: min(447px, 88%); padding: 10px 12px 8px; border-radius: 9px; background: #fff; box-shadow: 0 1px 1px rgba(0,0,0,.06); }
        .wcc-msg p { white-space: pre-line; font-size: 13px; line-height: 1.33; color: var(--ad-ink); }
        .wcc-msg small { display: block; margin-top: 4px; text-align: right; font-size: 12px; color: var(--ad-muted); }
        .wcc-msg.is-me { align-self: flex-end; width: auto; max-width: 88%; background: #d9fdd3; }
        .wcc-msg.is-me small { margin-top: 0; }
        .wcc-send { display: flex; gap: 8px; padding: 11px 14px 0; }
        .wcc-send .ad-input { width: 173px; height: 42px; flex: 0 1 173px; }
        .wcc-send .ad-input::placeholder { color: #757575; }
        .wcc-send .ad-btn { width: 43px; height: 42px; padding: 0; font-size: 14px; }
        .wcc-note { padding: 10px 14px 12px; font-size: 12px; color: var(--ad-muted); }

        .wcc-side { display: flex; flex-direction: column; gap: 18px; }
        .wcc-box { padding: 22px 22px 26px; border-radius: 16px; border: 1px solid var(--ad-line); }
        .wcc-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .wcc-details div { min-height: 78px; padding: 20px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .wcc-details div:nth-child(n+3) { min-height: 115px; }
        .wcc-details p { font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
        .wcc-details b { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; line-height: 1.33; color: var(--ad-ink); }
        .wcc-details a:hover { color: var(--ad-primary); }
        .wcc-move { display: flex; align-items: center; gap: 10px; margin-top: 20px; font-size: 12px; color: var(--ad-muted); }
        .wcc-move select { width: 220px; height: 45px; padding: 0 12px; font-size: 14px; color: #293652; }
        .wcc-btns { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
        .wcc-btn { display: inline-flex; align-items: center; height: 41px; padding: 0 15px; border-radius: 10px; border: 1px solid var(--ad-line-2); font-size: 14px; font-weight: 800; color: var(--ad-primary-ink); }
        .wcc-btn:hover { border-color: var(--ad-primary); }
        .wcc-links { display: flex; gap: 18px; margin: 16px 0 0 8px; }
        .wcc-links button { padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wcc-links button:last-child:hover { color: var(--ad-red); }
        .wcc-modal { padding: 24px; }
        .wcc-modal p { margin-top: 10px; font-size: 13px; color: var(--ad-muted); }
        .wcc-modal__act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

        @media (max-width: 1180px) { .wcc-grid { grid-template-columns: 1fr; } .wcc-send .ad-input { flex: 1; width: auto; } }
        @media (max-width: 640px) {
          .wcc { padding: 16px 14px 24px; }
          .wcc-back { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: var(--ad-soft); font-weight: 800; }
          .wcc-chat__head { height: auto; padding: 12px; flex-wrap: wrap; }
          .wcc-open { height: 36px; }
          .wcc-box { padding: 18px 14px; }
          .wcc-details div, .wcc-details div:nth-child(n+3) { min-height: 0; padding: 14px; }
          .wcc-move { flex-wrap: wrap; }
          .wcc-move select { width: 100%; }
          .wcc-btn { flex: 1 1 100%; justify-content: center; }
        }
      `}</style>
    </AdminShell>
  );
}
