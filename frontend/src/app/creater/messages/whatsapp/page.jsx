"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import InboxTabs from "@/components/creater/InboxTabs";
import { errText, useCreatorUser, getWaContact, getWaConversations, getWaMessages, subscribeWaMessages, setWaOptOut, sendWa, hasRealtime } from "@/services/creator";
import { ArrowLeft, Send, Search, ArrowRight } from "@/components/ui/Icons";

const GEEK = "916398566704"; // Geek ka WhatsApp number
const hhmm = (t) => {
  if (!t) return "";
  const d = new Date(t);
  return isNaN(d) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
};
function ago(t, now) {
  if (!t || !now) return "";
  const m = Math.round((now - new Date(t).getTime()) / 60000);
  return m < 1 ? "now" : m < 60 ? m + "m" : m < 1440 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d";
}
const TICKS = { queued: "…", sent: "✓", delivered: "✓✓", read: "✓✓ read", failed: "⚠ failed" };
const nameOf = (c) => (String(c.contact_phone_e164 || "").replace(/\D/g, "") === GEEK ? "Geek team" : c.subject || c.contact_phone_e164 || "Chat");

/**
 * /creater/messages/whatsapp — WhatsApp chats (campaign updates + Geek team)
 * Purane whatsapp.js jaisa: wa_contacts (number + pause) · wa_set_opt_out · wa_conversations · wa_messages · wa-send
 * Naye message realtime (Supabase channel) — na mile to har 10 sec refresh.
 */
export default function InboxWhatsApp() {
  const { user, ready } = useCreatorUser();
  const [contact, setContact] = useState(undefined); // undefined = loading, null = link nahi
  const [chats, setChats] = useState(null);
  const [err, setErr] = useState("");
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [nName, setNName] = useState("");
  const [nNum, setNNum] = useState("");
  const [now, setNow] = useState(0);
  const endRef = useRef(null);
  const c = (chats || []).find((x) => x.id === active);
  const list = (chats || []).filter((x) => [nameOf(x), x.contact_phone_e164, x.subject].join(" ").toLowerCase().includes(q.toLowerCase()));
  const numOk = /^\+?\d[\d\s]{9,14}$/.test(nNum.trim());
  const paused = !!contact?.opt_out_at;

  const loadStatus = async () => {
    if (!user) return;
    const { data, error } = await getWaContact(user.id);
    setContact(error ? null : data || null);
  };
  const loadChats = async () => {
    const { data, error } = await getWaConversations();
    if (error) return setErr(errText(error));
    setErr("");
    setChats((old) => [...(data || []), ...(old || []).filter((x) => x.pending)]);
  };
  const loadMsgs = async (id) => {
    if (!id || String(id).startsWith("new-")) return setMsgs([]);
    const { data } = await getWaMessages(id);
    setMsgs(data || []);
  };

  useEffect(() => {
    setNow(Date.now());
    if (!ready) return;
    loadStatus();
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  // khule chat ke naye message: realtime (purane jaisa) ya 10 sec poll
  useEffect(() => {
    loadMsgs(active);
    if (!active || String(active).startsWith("new-")) return;
    const stop = subscribeWaMessages(active, {
      onInsert: (row) => setMsgs((m) => (m.some((x) => x.id === row.id) ? m : [...m, row])),
      onUpdate: (row) => setMsgs((m) => m.map((x) => (x.id === row.id ? row : x))),
    });
    const t = stop ? null : setInterval(() => loadMsgs(active), 10000);
    return () => {
      if (stop) stop();
      if (t) clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [active, msgs]);

  const togglePause = async () => {
    const { error } = await setWaOptOut(!paused);
    if (error) return setNote(errText(error));
    loadStatus();
  };

  const send = async (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || !c || busy) return;
    setBusy(true);
    setNote("");
    const body = c.pending ? { to_phone: c.contact_phone_e164, text: v } : { conversation_id: c.id, text: v };
    const { data, error } = await sendWa(body);
    setBusy(false);
    if (error) {
      const m = errText(error);
      return setNote(/24-hour/.test(m) ? "WhatsApp only allows a reply within 24 hours of their last message — the Geek team will reach out to reopen the chat." : `Couldn't send: ${m}`);
    }
    setText("");
    if (c.pending) {
      setChats((all) => (all || []).filter((x) => x.id !== c.id));
      await loadChats();
      if (data?.conversation_id) setActive(data.conversation_id);
    } else if (!hasRealtime()) loadMsgs(c.id);
  };
  const create = (e) => {
    e.preventDefault();
    if (!nName.trim() || !numOk) return;
    const id = `new-${Date.now()}`;
    setChats((all) => [{ id, pending: true, subject: nName.trim(), contact_phone_e164: nNum.replace(/\s/g, ""), last_message_at: null }, ...(all || [])]);
    setActive(id);
    setNewOpen(false);
    setNName("");
    setNNum("");
  };

  return (
    <BountyShell>
      <title>WhatsApp — Bounty</title>
      <InboxTabs />

      {contact !== undefined && (
        <div className="bx-card wa-bar">
          {contact && contact.verified_at ? (
            <>
              <span>
                💬 WhatsApp <b>{contact.phone_e164}</b> {paused ? "· updates paused" : "receiving campaign updates"}
              </span>
              <button type="button" className={`bx-btn bx-btn--sm ${paused ? "bx-btn--dark" : "bx-btn--ghost"}`} onClick={togglePause}>
                {paused ? "Resume updates" : "Pause updates"}
              </button>
            </>
          ) : (
            <>
              <span>💬 Get campaign updates on WhatsApp.</span>
              <Link href="/creater/profile/contact" className="bx-btn bx-btn--sm bx-btn--dark">
                Link WhatsApp
              </Link>
            </>
          )}
        </div>
      )}

      <div className={`wa ${c ? "is-open" : ""}`}>
        <aside className="bx-card wa-list">
          <div className="wa-list__head">
            <h2>
              💬 WhatsApp chats
            </h2>
            <button type="button" className="bx-btn bx-btn--dark bx-btn--sm" onClick={() => setNewOpen(!newOpen)}>
              + New
            </button>
          </div>
          {newOpen && (
            <form className="wa-new" onSubmit={create}>
              <input className="bx-input" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Name" aria-label="Name" />
              <input className="bx-input" value={nNum} onChange={(e) => setNNum(e.target.value)} placeholder="+91 98xxx xxxxx" aria-label="Number" inputMode="tel" />
              {nNum && !numOk && <p className="bx-err">Enter a 10-digit number with country code.</p>}
              <button type="submit" className="bx-btn bx-btn--dark bx-btn--sm" disabled={!nName.trim() || !numOk}>
                Start chat <ArrowRight size={12} />
              </button>
            </form>
          )}
          <label className="wa-search">
            <Search size={13} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or number…" aria-label="Search chats" />
          </label>
          {chats === null ? (
            <p className="wa-none">{err ? `Couldn't load conversations: ${err}` : "Loading…"}</p>
          ) : list.length === 0 ? (
            <p className="wa-none">{chats.length ? "No chat matches." : "No conversations yet. Tap “New”."}</p>
          ) : (
            <ul>
              {list.map((x) => (
                <li key={x.id}>
                  <button type="button" className={x.id === active ? "is-on" : ""} onClick={() => setActive(x.id)}>
                    <span className="wa-av">{nameOf(x).replace(/^[@+]/, "")[0]}</span>
                    <span className="wa-txt">
                      <strong>{nameOf(x)}</strong>
                      <small>{x.pending ? "New chat" : nameOf(x) !== x.contact_phone_e164 ? x.contact_phone_e164 : x.subject || ""}</small>
                    </span>
                    <span className="wa-time">{ago(x.last_message_at, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="bx-card wa-chat">
          {!c ? (
            <p className="wa-pick">← Pick a chat to read and reply</p>
          ) : (
            <>
              <div className="wa-chat__head">
                <button type="button" className="wa-back" onClick={() => setActive(null)} aria-label="Back to chats">
                  <ArrowLeft size={15} />
                </button>
                <span className="wa-av">{nameOf(c).replace(/^[@+]/, "")[0]}</span>
                <span>
                  <strong>{nameOf(c)}</strong>
                  <small>{c.contact_phone_e164}</small>
                </span>
              </div>
              <div className="wa-msgs">
                {msgs.length === 0 && <p className="wa-hint">Say hi 👋 — messages send from your WhatsApp number.</p>}
                {msgs.map((m) => (
                  <p key={m.id} className={m.direction === "outbound" ? "is-me" : ""}>
                    {m.body}
                    <small>
                      {hhmm(m.created_at)}
                      {m.direction === "outbound" ? ` · ${TICKS[m.status] || m.status || ""}` : ""}
                    </small>
                  </p>
                ))}
                <span ref={endRef} />
              </div>
              <form className="wa-send" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" aria-label="Message" />
                <button type="submit" disabled={!text.trim() || busy} aria-label="Send">
                  <Send size={15} />
                </button>
              </form>
              {note && <p className="wa-note">{note}</p>}
            </>
          )}
        </section>
      </div>

      <style>{`
        .wa-note { margin: 6px 4px 0; font-size: 12.5px; color: #b8401f; }
        .wa-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; max-width: 720px; margin: 0 auto 12px; padding: 8px 8px 8px 14px; font-size: 14px; }
        .wa-bar span { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; color: var(--bx-text); }
        .wa-bar span svg { color: #1c8f4e; }
        .wa-bar b { color: var(--bx-ink); }
        .wa-bar span { color: #14231a; }
        .wa-bar .bx-btn--sm { height: 36px; padding: 0 16px; font-size: 14px; }
        .wa { display: grid; grid-template-columns: 330px minmax(0, 1fr); gap: 12px; max-width: 720px; margin: 0 auto; height: min(580px, calc(100vh - 330px)); min-height: 440px; }
        .wa-list { display: flex; flex-direction: column; padding: 14px; overflow: hidden; }
        .wa-list__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .wa-list__head h2 { display: flex; align-items: center; gap: 6px; font-size: 18.7px; line-height: 24px; font-weight: 700; color: #14231a; }
        .wa-new { display: grid; gap: 8px; margin-bottom: 10px; padding: 10px; border-radius: 12px; background: #fffaf0; border: 1px solid var(--bx-line); }
        .wa-new .bx-input { height: 38px; }
        .wa-search { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 12px; margin-bottom: 8px; border-radius: 10px; border: 1px solid var(--bx-line); background: #fffdf6; color: var(--bx-muted); }
        .wa-search input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 14px; font-weight: 500; }
        .wa-none { font-size: 13px; color: #7a6a4a; }
        .wa-list ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
        .wa-list li button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 0; border-radius: 12px; background: none; text-align: left; }
        .wa-list li button:hover { background: #f3e6c8; }
        .wa-list li button.is-on { background: #efdcb4; }
        .wa-av { width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: #25d366; color: #fff; font-weight: 700; }
        .wa-txt { flex: 1; min-width: 0; }
        .wa-txt strong { display: block; font-size: 13.5px; }
        .wa-txt small { display: block; font-size: 12px; color: var(--bx-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wa-time { font-size: 11px; color: var(--bx-muted); white-space: nowrap; }
        .wa-chat { display: flex; flex-direction: column; overflow: hidden; }
        .wa-pick { margin: 0; padding: 12px 14px; font-size: 14px; color: #7a6a4a; }
        .wa-chat__head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--bx-line); background: #f6ebd3; }
        .wa-chat__head strong { display: block; font-size: 14px; }
        .wa-chat__head small { font-size: 12px; color: var(--bx-muted); }
        .wa-back { display: none; border: 0; background: none; padding: 4px; }
        .wa-msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 16px; background: #efe5d0; }
        .wa-msgs p { margin: 0; max-width: 75%; padding: 8px 12px 5px; border-radius: 12px; background: #fffdf6; font-size: 13.5px; line-height: 1.45; align-self: flex-start; box-shadow: 0 1px 1px rgba(0,0,0,.06); }
        .wa-msgs p.is-me { align-self: flex-end; background: #d9fdd3; }
        .wa-msgs small { display: block; margin-top: 2px; text-align: right; font-size: 10.5px; color: var(--bx-muted); }
        .wa-msgs .wa-hint { align-self: center; max-width: none; background: #fff3cf; font-size: 12px; }
        .wa-send { display: flex; gap: 8px; padding: 10px; border-top: 1px solid var(--bx-line); }
        .wa-send input { flex: 1; min-width: 0; height: 42px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--bx-line); background: #fffdf6; outline: none; }
        .wa-send button { width: 42px; height: 42px; border-radius: 50%; border: 0; background: #1c8f4e; color: #fff; display: grid; place-items: center; }
        .wa-send button:disabled { opacity: .45; }

        @media (max-width: 767px) {
          .wa { grid-template-columns: minmax(0, 1fr); height: calc(100vh - 380px); min-height: 380px; }
          .wa-chat { display: none; }
          .wa.is-open .wa-list { display: none; }
          .wa.is-open .wa-chat { display: flex; }
          .wa-back { display: grid; }
        }
      `}</style>
    </BountyShell>
  );
}
