"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import InboxTabs from "@/components/creater/InboxTabs";
import { useSession } from "@/components/creater/session";
import { CREATOR, IG_THREADS } from "@/components/creater/data";
import { ArrowLeft, Send, Instagram } from "@/components/ui/Icons";

/** /creater/messages/instagram — Instagram DMs (connected account se reply) */
export default function InboxInstagram() {
  const [s] = useSession();
  const [threads, setThreads] = useState(IG_THREADS);
  const [open, setOpen] = useState(null); // mobile par null = list
  const [active, setActive] = useState(IG_THREADS[0].id);
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const t = threads.find((x) => x.id === active);

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [active, threads]);

  const pick = (id) => {
    setActive(id);
    setOpen(id);
    setThreads((all) => all.map((x) => (x.id === id ? { ...x, unread: false } : x)));
  };
  const send = (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    setThreads((all) => all.map((x) => (x.id === active ? { ...x, last: v, time: "now", msgs: [...x.msgs, { me: true, text: v, time: now }] } : x)));
    setText("");
  };

  return (
    <BountyShell>
      <title>Instagram DMs — Bounty</title>
      <InboxTabs />

      {!s.ig ? (
        <section className="bx-card ig-lock">
          <span>📷</span>
          <h2>Connect Instagram to read your DMs here</h2>
          <p>Reply to brands and followers without switching apps — replies send from your own account.</p>
          <Link href="/creater/onboarding/meta" className="bx-btn bx-btn--dark">
            <Instagram size={14} /> Connect Instagram
          </Link>
        </section>
      ) : (
        <>
          <p className="ig-of">
            Instagram inbox of <b>{CREATOR.handle}</b> — replies send from this account.
          </p>
          <div className={`ig ${open ? "is-open" : ""}`}>
            <aside className="bx-card ig-list">
              <h2>Instagram inbox</h2>
              <ul>
                {threads.map((x) => (
                  <li key={x.id}>
                    <button type="button" className={x.id === active ? "is-on" : ""} onClick={() => pick(x.id)}>
                      <span className="ig-av">{x.name[0]}</span>
                      <span className="ig-txt">
                        <strong>
                          {x.name} <small>{x.handle}</small>
                        </strong>
                        <small>{x.last}</small>
                      </span>
                      <span className="ig-time">
                        {x.time}
                        {x.unread && <i />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            <section className="bx-card ig-chat">
              <div className="ig-chat__head">
                <button type="button" className="ig-back" onClick={() => setOpen(null)} aria-label="Back to chats">
                  <ArrowLeft size={15} />
                </button>
                <span className="ig-av">{t.name[0]}</span>
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.handle}</small>
                </span>
              </div>
              <div className="ig-msgs">
                {t.msgs.map((m, i) => (
                  <p key={i} className={m.me ? "is-me" : ""}>
                    {m.text}
                    <small>{m.time}</small>
                  </p>
                ))}
                <span ref={endRef} />
              </div>
              <form className="ig-send" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${t.name}…`} aria-label="Message" />
                <button type="submit" disabled={!text.trim()} aria-label="Send">
                  <Send size={15} />
                </button>
              </form>
            </section>
          </div>
        </>
      )}

      <style>{`
        .ig-lock { max-width: 640px; margin: 0 auto; padding: 36px 24px; text-align: center; }
        .ig-lock > span { font-size: 32px; }
        .ig-lock h2 { margin: 8px 0; font-family: var(--bx-serif); font-size: 21px; font-weight: 600; }
        .ig-lock p { margin: 0 auto 16px; max-width: 420px; font-size: 13.5px; color: var(--bx-text); }
        .ig-of { max-width: 720px; margin: 0 auto 10px; font-size: 12.5px; color: #7a6a4a; }
        .ig { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 12px; max-width: 720px; margin: 0 auto; height: min(560px, calc(100vh - 300px)); min-height: 420px; }
        .ig-list { display: flex; flex-direction: column; padding: 14px; overflow: hidden; }
        .ig-list h2 { margin-bottom: 10px; font-family: var(--bx-serif); font-size: 15px; font-weight: 600; }
        .ig-list ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
        .ig-list button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 0; border-radius: 12px; background: none; text-align: left; }
        .ig-list button:hover { background: #f3e6c8; }
        .ig-list button.is-on { background: #efdcb4; }
        .ig-av { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af); color: #fff; font-weight: 700; }
        .ig-txt { flex: 1; min-width: 0; }
        .ig-txt strong { display: block; font-size: 13.5px; }
        .ig-txt strong small { font-weight: 400; color: var(--bx-muted); }
        .ig-txt > small { display: block; font-size: 12px; color: var(--bx-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ig-time { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; font-size: 11px; color: var(--bx-muted); }
        .ig-time i { width: 8px; height: 8px; border-radius: 50%; background: var(--bx-red-2); }
        .ig-chat { display: flex; flex-direction: column; overflow: hidden; }
        .ig-chat__head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--bx-line); }
        .ig-chat__head strong { display: block; font-size: 14px; }
        .ig-chat__head small { font-size: 12px; color: var(--bx-muted); }
        .ig-back { display: none; border: 0; background: none; padding: 4px; }
        .ig-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 16px; background: #f7ecd5; }
        .ig-msgs p { margin: 0; max-width: 75%; padding: 9px 12px 5px; border-radius: 16px; background: #fffdf6; font-size: 13.5px; line-height: 1.45; align-self: flex-start; }
        .ig-msgs p.is-me { align-self: flex-end; background: var(--bx-green); color: var(--bx-cream); }
        .ig-msgs small { display: block; margin-top: 2px; text-align: right; font-size: 10.5px; opacity: .65; }
        .ig-send { display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--bx-line); }
        .ig-send input { flex: 1; min-width: 0; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--bx-line); background: #fffdf6; outline: none; }
        .ig-send button { width: 42px; height: 42px; border-radius: 50%; border: 0; background: var(--bx-green); color: var(--bx-cream); display: grid; place-items: center; }
        .ig-send button:disabled { opacity: .45; }

        @media (max-width: 767px) {
          .ig { grid-template-columns: minmax(0, 1fr); height: calc(100vh - 330px); min-height: 380px; }
          .ig-chat { display: none; }
          .ig.is-open .ig-list { display: none; }
          .ig.is-open .ig-chat { display: flex; }
          .ig-back { display: grid; }
        }
      `}</style>
    </BountyShell>
  );
}
