"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHead } from "@/components/admin/ui";
import { sbFor, rpc, invoke, errText } from "@/lib/supabase";
import { ago, fmtDateTime } from "@/components/admin/brand/util";

/* naam: members (admin_users) + bulk upload / invites (api.admin_wa_names) — purane whatsapp.js jaisa */
const digits = (p) => String(p || "").replace(/\D/g, "");
async function loadNames() {
  const names = {};
  const [u, w] = await Promise.all([rpc("admin", "admin_users"), rpc("admin", "api.admin_wa_names")]);
  const W = w.data || {};
  Object.keys(W).forEach((k) => (names[k] = { n: W[k].n || "", h: W[k].h || "" }));
  (u.data || []).forEach((x) => {
    if (!x.whatsapp) return;
    const k = digits(x.whatsapp);
    const o = names[k] || {};
    names[k] = { n: x.name && x.name !== "Creator" ? x.name : o.n || "", h: x.ig_username || o.h || "" };
  });
  return names;
}
export const whoOf = (c, names) => {
  const x = names[digits(c.contact_phone_e164)] || {};
  return { name: x.n || (x.h ? `@${x.h}` : "") || c.contact_phone_e164 || "—", handle: x.h };
};
const TICK = { queued: "…", sent: "✓", delivered: "✓✓", read: "✓✓ read", failed: "⚠ failed" };

/** Saari conversations + naam (inbox list aur new chat dono use karte hain) */
export function useConversations() {
  const [st, setSt] = useState({ list: [], names: {}, loading: true, error: null });
  const load = useCallback(async () => {
    const [r, names] = await Promise.all([
      sbFor("admin").from("wa_conversations").select("id,subject,contact_phone_e164,last_message_at").order("last_message_at", { ascending: false, nullsFirst: false }).limit(200),
      loadNames().catch(() => ({})),
    ]);
    setSt({ list: r.data || [], names, loading: false, error: r.error || null });
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { ...st, reload: load };
}

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
  const { list: all, names, loading, error, reload } = useConversations();
  const openId = chatId || all[0]?.id || null;
  const open = all.find((c) => c.id === openId) || null;
  const who = open ? whoOf(open, names) : null;
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [mLoad, setMLoad] = useState(false);
  const [mErr, setMErr] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState("");
  const endRef = useRef(null);

  // ek chat ke messages (wa_messages) — realtime ho to live, warna har 6 sec
  const loadMsgs = useCallback(async (id, quiet) => {
    if (!quiet) setMLoad(true);
    const r = await sbFor("admin").from("wa_messages").select("id,direction,body,status,created_at").eq("conversation_id", id).order("created_at", { ascending: true }).limit(500);
    setMLoad(false);
    if (r.error) return setMErr(errText(r.error));
    setMErr("");
    setMsgs(r.data || []);
  }, []);
  useEffect(() => {
    if (!openId) return;
    setMsgs([]);
    loadMsgs(openId);
    const sb = sbFor("admin");
    let ch = null;
    let t = null;
    if (typeof sb.channel === "function") {
      ch = sb
        .channel(`wa:${openId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "wa_messages", filter: `conversation_id=eq.${openId}` }, () => loadMsgs(openId, true))
        .subscribe();
    } else {
      t = setInterval(() => document.visibilityState === "visible" && loadMsgs(openId, true), 6000);
    }
    return () => {
      if (ch) sb.removeChannel(ch);
      if (t) clearInterval(t);
    };
  }, [openId, loadMsgs]);
  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [msgs]);

  const qq = q.trim().toLowerCase();
  const list = all.filter((c) => {
    const w = whoOf(c, names);
    return !qq || [w.name, w.handle, c.contact_phone_e164, c.subject].join(" ").toLowerCase().includes(qq);
  });

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !openId || sending) return;
    setSending(true);
    setSendErr("");
    const r = await invoke("admin", "wa-send", { conversation_id: openId, text: t });
    setSending(false);
    if (r.error) {
      const m = errText(r.error);
      return setSendErr(/24-hour/.test(m) ? `${m} — start a “New” chat with an approved template to reopen it.` : `Couldn’t send: ${m}`);
    }
    setText("");
    loadMsgs(openId, true);
    reload();
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
            const w = whoOf(c, names);
            return (
              <Link key={c.id} href={`/admin/inbox/chat/${c.id}`} className={`ib-row ${openId === c.id ? "is-on" : ""}`}>
                <span className="ib-av">{String(w.name).replace(/^[@+]/, "").slice(0, 1).toUpperCase() || "+"}</span>
                <span className="ib-row__main">
                  <span className="ib-row__t">
                    <b>{w.name}</b> {c.last_message_at && <em>· {ago(c.last_message_at)}</em>}
                  </span>
                  <span className="ib-row__s">{[w.name !== c.contact_phone_e164 ? c.contact_phone_e164 : "", c.subject || "Campaign updates"].filter(Boolean).join(" · ")}</span>
                </span>
              </Link>
            );
          })}
          {loading && <p className="ib-none">Loading chats…</p>}
          {error && (
            <p className="ib-none ib-err">
              Couldn’t load conversations: {errText(error)}{" "}
              <button type="button" onClick={() => reload()}>
                Retry
              </button>
            </p>
          )}
          {!loading && !error && !all.length && <p className="ib-none">No conversations yet. Tap “+ New”.</p>}
          {!loading && all.length > 0 && !list.length && <p className="ib-none">No chat matches “{q}”</p>}
        </div>
      </section>

      <section className="ad-card ib-chat">
        <Link href="/admin/inbox" className="ib-back">
          ← Chats
        </Link>
        {open ? (
          <>
            <div className="ib-chat__head">
              <div>
                <h2 className="ad-h2">{who.name}</h2>
                <p className="ib-chat__s">
                  {open.contact_phone_e164} · {open.subject || "Campaign updates"}
                </p>
              </div>
              <a href={`https://wa.me/${digits(open.contact_phone_e164)}`} target="_blank" rel="noreferrer" className="ib-wa">
                Open in WhatsApp ↗
              </a>
            </div>
            <div className="ib-msgs" aria-live="polite">
              {mLoad && !msgs.length && <p className="ib-sys">Loading…</p>}
              {mErr && <p className="ib-sys">Couldn’t load: {mErr}</p>}
              {msgs.map((m) => (
                <p key={m.id} className={m.direction === "outbound" ? "ib-me" : "ib-them"}>
                  {m.body}
                  <small>
                    {fmtDateTime(m.created_at)}
                    {m.direction === "outbound" ? ` · ${TICK[m.status] || m.status || ""}` : ""}
                  </small>
                </p>
              ))}
              <span ref={endRef} />
            </div>
            {sendErr && <p className="ib-senderr">{sendErr}</p>}
            <form className="ib-send" onSubmit={send}>
              <input className="ad-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" aria-label="Type a message" disabled={sending} />
              <button type="submit" className="ad-btn ad-btn--primary" aria-label="Send" disabled={sending || !text.trim()}>
                ➤
              </button>
            </form>
          </>
        ) : (
          <p className="ib-none">{loading ? "Loading…" : "Pick a chat, or start one with “+ New”."}</p>
        )}
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
        .ib-err { color: var(--ad-red); }
        .ib-err button { border: 0; background: none; padding: 0; font-weight: 800; color: #6657e9; }
        .ib-msgs p small { display: block; margin-top: 3px; font-size: 10.5px; color: var(--ad-muted); }
        .ib-msgs p.ib-sys { align-self: center; background: transparent; color: var(--ad-muted); font-size: 12px; }
        .ib-senderr { margin-top: 8px; font-size: 12px; color: var(--ad-red); }

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
