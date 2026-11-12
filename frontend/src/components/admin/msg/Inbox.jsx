"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHead } from "@/components/admin/ui";

/* Figma 078 — WhatsApp chats (dummy) */
export const CHATS = [
  {
    id: "knightcrawler",
    name: "KnightCrawler Studios",
    av: "K",
    ago: "12m",
    sub: "Campaign updates",
    phone: "+91 82768•••52",
    unread: 1,
    msgs: [
      { me: false, t: "Hi, is the Detan kit shipped?" },
      { me: false, t: "Tracking please 🙏" },
      { me: true, t: "Shipped today — DTDC 7D1439… ✓✓" },
    ],
  },
  { id: "swathi", name: "Swathi", av: "S", ago: "1h", sub: "Circle Diwali Declutter", phone: "+91 99001•••18", unread: 2, msgs: [{ me: false, t: "Hi! I got approved for Circle Diwali 🎉" }, { me: false, t: "When should I post the reel?" }] },
  { id: "9873601", name: "+91 98736•••01", av: "+", ago: "1h", sub: "Campaign updates", phone: "+91 98736•••01", unread: 0, msgs: [{ me: true, t: "Hi! Your application for Vaaree Diwali is under review." }, { me: false, t: "Okay thank you" }] },
  { id: "smarty", name: "Smarty ❤️", av: "S", ago: "3h", sub: "Campaign updates", phone: "+91 90040•••77", unread: 0, msgs: [{ me: false, t: "Draft uploaded, please check 🙂" }, { me: true, t: "Got it — reviewing today ✓✓" }] },
  { id: "ansh-notnani", name: "Ansh Notnani", av: "A", ago: "3h", sub: "Campaign updates", phone: "+91 98110•••45", unread: 0, msgs: [{ me: false, t: "Can I change my address?" }, { me: true, t: "Yes — update it in your profile before dispatch." }] },
  { id: "archi-ranka", name: "Archi Ranka", av: "A", ago: "5h", sub: "Campaign updates", phone: "+91 97690•••03", unread: 0, msgs: [{ me: false, t: "Thank you for the product! Loved it 💛" }] },
];

const KEY = "geek_admin_wa_sent";
const readSent = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

/** Messages ka header + WhatsApp / Instagram tabs */
export function InboxHead() {
  const pathname = usePathname() || "";
  const ig = pathname.startsWith("/admin/inbox/instagram");
  return (
    <>
      <PageHead title="Messages" sub="WhatsApp chats and Instagram DMs with creators — reply without leaving Geek OS.">
        <Link href="/admin/inbox/new" className="ad-btn ad-btn--primary ih-new">
          + New
        </Link>
      </PageHead>
      <nav className="ih-tabs" aria-label="Inbox">
        <Link href="/admin/inbox" className={`ad-tab ${!ig ? "is-on" : ""}`}>
          💬 WhatsApp
        </Link>
        <Link href="/admin/inbox/instagram" className={`ad-tab ${ig ? "is-on" : ""}`}>
          📸 Instagram DMs
        </Link>
      </nav>
      <style>{`
        .ih-new { height: 41px !important; padding: 0 16px !important; }
        .ih-tabs { display: flex; gap: 8px; margin: -4px 0 16px; }
        .ih-tabs .ad-tab { height: 37px; }
        .ih-tabs .ad-tab:not(.is-on) { color: #67718a; background: transparent; }
        .ih-tabs .ad-tab:not(.is-on):hover { background: var(--ad-soft); }
      `}</style>
    </>
  );
}

/**
 * WhatsApp inbox — list + chat.
 * Desktop: dono saath. Mobile: /admin/inbox par sirf list, /admin/inbox/chat/[id] par sirf chat (← Chats).
 */
export default function Inbox({ chatId }) {
  const open = CHATS.find((c) => c.id === chatId) || CHATS[0];
  const [q, setQ] = useState("");
  const [sent, setSent] = useState({});
  const [read, setRead] = useState({});
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => setSent(readSent()), []);
  useEffect(() => {
    if (chatId) setRead((r) => ({ ...r, [chatId]: true }));
  }, [chatId]);
  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [sent, open.id]);

  const msgs = [...open.msgs, ...(sent[open.id] || []).map((t) => ({ me: true, t }))];
  const list = CHATS.filter((c) => (c.name + c.sub).toLowerCase().includes(q.trim().toLowerCase()));

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const next = { ...sent, [open.id]: [...(sent[open.id] || []), `${t} ✓✓`] };
    setSent(next);
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setText("");
  };

  return (
    <div className={`ib ${chatId ? "ib--chat" : ""}`}>
      <section className="ad-card ib-list">
        <div className="ib-list__head">
          <h2 className="ad-h2">💬 WhatsApp chats</h2>
          <input className="ad-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats…" aria-label="Search chats" />
        </div>
        <div className="ib-rows">
          {list.map((c) => {
            const last = (sent[c.id] || []).slice(-1)[0];
            const unread = read[c.id] || c.id === chatId ? 0 : c.unread;
            return (
              <Link key={c.id} href={`/admin/inbox/chat/${c.id}`} className={`ib-row ${chatId === c.id ? "is-on" : ""}`}>
                <span className="ib-av">{c.av}</span>
                <span className="ib-row__main">
                  <span className="ib-row__t">
                    <b>{c.name}</b> <em>· {last ? "now" : c.ago}</em>
                  </span>
                  <span className="ib-row__s">{last ? `You: ${last}` : c.sub}</span>
                </span>
                {unread > 0 && <span className="ib-un">{unread}</span>}
              </Link>
            );
          })}
          {!list.length && <p className="ib-none">No chat matches “{q}”</p>}
        </div>
      </section>

      <section className="ad-card ib-chat">
        <Link href="/admin/inbox" className="ib-back">
          ← Chats
        </Link>
        <div className="ib-chat__head">
          <div>
            <h2 className="ad-h2">{open.name}</h2>
            <p className="ib-chat__s">
              {open.phone} · {open.sub}
            </p>
          </div>
          <a href="https://web.whatsapp.com/" target="_blank" rel="noreferrer" className="ib-wa">
            Open in WhatsApp ↗
          </a>
        </div>
        <div className="ib-msgs" aria-live="polite">
          {msgs.map((m, i) => (
            <p key={i} className={m.me ? "ib-me" : "ib-them"}>
              {m.t}
            </p>
          ))}
          <span ref={endRef} />
        </div>
        <form className="ib-send" onSubmit={send}>
          <input className="ad-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" aria-label="Type a message" />
          <button type="submit" className="ad-btn ad-btn--primary" aria-label="Send">
            ➤
          </button>
        </form>
      </section>

      <style>{`
        .ib { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .ib-list { padding: 22px 22px 30px; min-width: 0; }
        .ib-list__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .ib-list__head .ad-input { width: 173px; height: 42px; }
        .ib-rows { display: flex; flex-direction: column; gap: 10px; }
        .ib-row { display: flex; align-items: center; gap: 14px; min-height: 67px; padding: 0 22px 0 13px; border-radius: 14px; border: 1px solid var(--ad-line); transition: border-color .15s, background .15s; }
        .ib-row:hover { border-color: #cfd2ee; }
        .ib-row.is-on { border-color: #cfc9fb; background: #faf9ff; }
        .ib-av { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; color: var(--ad-ink); }
        .ib-row__main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .ib-row__t { font-size: 14px; color: var(--ad-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ib-row__t b { font-weight: 700; }
        .ib-row__t em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--ad-muted); }
        .ib-row__s { margin-top: 5px; font-size: 12px; color: #8791a7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ib-un { min-width: 24px; height: 24px; padding: 0 6px; border-radius: 12px; display: grid; place-items: center; background: var(--ad-lilac); color: #6857ec; font-size: 11px; font-weight: 700; }
        .ib-none { padding: 12px 4px; font-size: 13px; color: var(--ad-muted); }

        .ib-chat { padding: 22px 22px 22px; min-width: 0; }
        .ib-back { display: none; }
        .ib-chat__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .ib-chat__s { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .ib-wa { margin-top: 13px; font-size: 14px; font-weight: 800; color: #6657e9; white-space: nowrap; }
        .ib-msgs { display: flex; flex-direction: column; gap: 8px; height: 260px; margin-top: 19px; padding: 14px 14px; border-radius: 14px; background: #f2efe8; overflow-y: auto; }
        .ib-msgs p { max-width: 283px; padding: 9px 12px; border-radius: 9px; font-size: 13px; line-height: 1.3; color: var(--ad-ink); overflow-wrap: anywhere; }
        .ib-them { align-self: flex-start; width: 283px; background: #fff; }
        .ib-me { align-self: flex-end; background: #dcf6cf; }
        .ib-send { display: flex; gap: 8px; margin-top: 10px; }
        .ib-send .ad-input { max-width: 173px; height: 42px; }
        .ib-send .ad-btn { width: 44px; height: 42px; padding: 0; font-size: 14px; }

        @media (max-width: 1180px) {
          .ib { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
          .ib-send .ad-input { max-width: none; flex: 1; }
          .ib-them { width: auto; }
        }
        @media (max-width: 767px) {
          .ib { grid-template-columns: 1fr; }
          .ib-chat { display: none; }
          .ib--chat .ib-list { display: none; }
          .ib--chat .ib-chat { display: block; }
          .ib-back { display: inline-flex; margin-bottom: 12px; font-size: 13px; font-weight: 800; color: var(--ad-primary-ink); }
          .ib-list, .ib-chat { padding: 18px 16px; }
          .ib-list__head { flex-wrap: wrap; }
          .ib-list__head .ad-input { width: 100%; }
          .ib-row { padding-right: 14px; }
          .ib-msgs { height: calc(100vh - 430px); min-height: 240px; }
          .ib-chat__head { flex-direction: column; gap: 0; }
          .ib-wa { margin-top: 8px; }
        }
      `}</style>
    </div>
  );
}
