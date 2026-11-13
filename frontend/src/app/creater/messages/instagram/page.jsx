"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BountyShell from "@/components/creater/BountyShell";
import InboxTabs from "@/components/creater/InboxTabs";
import { errText, useMyIg, igConversations, igThread, igSend } from "@/services/creator";
import { ArrowLeft, Send, Instagram } from "@/components/ui/Icons";

function ago(x, now) {
  if (!x || !now) return "";
  const m = Math.round((now - new Date(x).getTime()) / 60000);
  return m < 60 ? Math.max(m, 0) + "m" : m < 1440 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d";
}
const hhmm = (t) => {
  const d = new Date(t);
  return isNaN(d) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
};
// Instagram ne mana kiya to kyun, aur kya karna hai (purane mkDmProblem jaisa)
const PROBLEM = {
  reconnect: ["🔁 Reconnect Instagram once to allow messages", "This connection was made before messages were allowed. Reconnect Instagram and keep every permission switched on.", true],
  token_expired: ["🔁 Your Instagram connection expired", "Reconnect Instagram — takes 10 seconds.", true],
  messages_access_off: ["📱 Turn on “Allow access to messages” in Instagram", "Instagram → Settings → Messages and story replies → Message controls → Connected tools → Allow access to messages. Then try again.", false],
  app_access: ["🛠 Instagram messages aren't open for Geek yet", "Meta still has to approve messages for this app. Your DMs will show here once it does.", false],
};

/**
 * /creater/messages/instagram — Instagram DMs (connected account se reply)
 * Purane media kit inbox jaisa: instagram-dm function → conversations · thread · send
 */
export default function InboxInstagram() {
  const ig = useMyIg();
  const [threads, setThreads] = useState(null);
  const [me, setMe] = useState({});
  const [problem, setProblem] = useState(null);
  const [open, setOpen] = useState(null); // mobile par null = list
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [now, setNow] = useState(0);
  const endRef = useRef(null);
  const t = (threads || []).find((x) => x.id === active);

  const loadThreads = async () => {
    setProblem(null);
    const { data, error } = await igConversations();
    if (error || data?.reason) return setProblem({ ...(data || {}), error: data?.error || errText(error) });
    setMe(data?.me || {});
    const list = data?.threads || [];
    setThreads(list);
    setActive((a) => a || list[0]?.id || null);
  };
  const loadThread = async (id) => {
    setMsgs(null);
    const { data, error } = await igThread(id);
    if (error || data?.reason) return setProblem({ ...(data || {}), error: data?.error || errText(error) });
    setMsgs((data?.messages || []).slice().reverse());
  };
  useEffect(() => {
    setNow(Date.now());
    if (ig.acct) loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ig.acct]);
  useEffect(() => {
    if (active) loadThread(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  useEffect(() => {
    const box = endRef.current?.parentElement;
    if (box) box.scrollTop = box.scrollHeight;
  }, [active, msgs]);

  const mine = (m) => m.from && (String(m.from.id) === String(me.id) || m.from.username === me.username);
  const pick = (id) => {
    setActive(id);
    setOpen(id);
    setNote("");
  };
  const send = async (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v || !t?.with_id || busy) return;
    setBusy(true);
    setNote("");
    const { data, error } = await igSend(t.with_id, v);
    setBusy(false);
    if (error || data?.error) return setNote(data?.error || errText(error));
    setText("");
    loadThread(t.id);
  };
  const P = problem && PROBLEM[problem.reason];

  return (
    <BountyShell>
      <title>Instagram DMs — Bounty</title>
      <InboxTabs />

      {ig.loading ? (
        <p className="ig-of">Loading…</p>
      ) : !ig.acct ? (
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
            Instagram inbox of <b>@{ig.acct.username}</b> — replies send from this account.
          </p>
          {problem ? (
            <section className="bx-card ig-lock">
              <span>💬</span>
              <h2>{P ? P[0] : "Couldn't load your inbox"}</h2>
              <p>{P ? P[1] : problem.error}</p>
              {P && P[2] ? (
                <Link href="/creater/profile/instagram" className="bx-btn bx-btn--dark">
                  <Instagram size={14} /> Reconnect Instagram
                </Link>
              ) : (
                <button type="button" className="bx-btn bx-btn--dark" onClick={loadThreads}>
                  Try again
                </button>
              )}
            </section>
          ) : threads === null ? (
            <p className="ig-of">Loading your Instagram inbox…</p>
          ) : threads.length === 0 ? (
            <section className="bx-card ig-lock">
              <span>📭</span>
              <h2>No conversations yet</h2>
              <p>When brands or followers message you on Instagram, they show up here.</p>
            </section>
          ) : (
          <div className={`ig ${open ? "is-open" : ""}`}>
            <aside className="bx-card ig-list">
              <h2>Instagram inbox</h2>
              <ul>
                {threads.map((x) => (
                  <li key={x.id}>
                    <button type="button" className={x.id === active ? "is-on" : ""} onClick={() => pick(x.id)}>
                      <span className="ig-av">{String(x.with_username || "u")[0].toUpperCase()}</span>
                      <span className="ig-txt">
                        <strong>
                          @{x.with_username || "user"}
                        </strong>
                        <small>
                          {x.last_from_me ? "You: " : ""}
                          {x.last_text || ""}
                        </small>
                      </span>
                      <span className="ig-time">{ago(x.last_at || x.updated_time, now)}</span>
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
                <span className="ig-av">{String(t?.with_username || "u")[0].toUpperCase()}</span>
                <span>
                  <strong>@{t?.with_username || "user"}</strong>
                  <small>Replies within 24 h of their last message</small>
                </span>
              </div>
              <div className="ig-msgs">
                {msgs === null && <p className="ig-hint">Loading…</p>}
                {(msgs || []).map((m, i) => (
                  <p key={m.id || i} className={mine(m) ? "is-me" : ""}>
                    {m.message || m.text || ""}
                    <small>{hhmm(m.created_time)}</small>
                  </p>
                ))}
                <span ref={endRef} />
              </div>
              <form className="ig-send" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Reply to @${t?.with_username || ""}…`} aria-label="Message" />
                <button type="submit" disabled={!text.trim() || busy} aria-label="Send">
                  <Send size={15} />
                </button>
              </form>
              {note && <p className="ig-note">{note}</p>}
            </section>
          </div>
          )}
        </>
      )}

      <style>{`
        .ig-lock { max-width: 640px; margin: 0 auto; padding: 36px 24px; text-align: center; }
        .ig-lock > span { font-size: 32px; }
        .ig-lock h2 { margin: 8px 0; font-family: var(--bx-serif); font-size: 21px; font-weight: 600; }
        .ig-lock p { margin: 0 auto 16px; max-width: 420px; font-size: 13.5px; color: var(--bx-text); }
        .ig-note { margin: 6px 4px 0; font-size: 12.5px; color: #b8401f; }
        .ig-hint { font-size: 13px; color: #7a6a4a; }
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
