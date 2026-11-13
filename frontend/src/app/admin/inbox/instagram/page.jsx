"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { InboxHead } from "@/components/admin/msg/Inbox";
import { rpc, invoke, errText } from "@/lib/supabase";
import { ago } from "@/components/admin/brand/util";

/* purane app (app.js) ke Instagram constants */
const INSTAGRAM_APP_ID = "944216414793314";
const IG_SCOPES = "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights,instagram_business_manage_comments,instagram_business_manage_messages";
const STATE_KEY = "geek_admin_ig_state";
// Instagram yahin wapas bhejta hai — ye URL Meta app ke "Valid OAuth redirect URIs" mein hona chahiye
const redirectUri = () => `${window.location.origin}/admin/inbox/instagram`;

/* Instagram ne mana kiya → kyun, aur kya karna hai (purane mkDmProblem jaisa) */
const PROBLEM = {
  reconnect: "Connect Instagram once to allow messages — on Instagram’s screen keep every permission on, including Manage messages.",
  token_expired: "Your Instagram connection expired — reconnect Instagram (takes 10 seconds).",
  messages_access_off: "Turn on “Allow access to messages” in Instagram → Settings → Messages and story replies → Message controls → Connected tools, then refresh.",
  app_access: "Meta hasn’t opened messages for this app yet — instagram_business_manage_messages needs Advanced access and the app must be Live.",
};

/**
 * /admin/inbox/instagram — Instagram DMs (Figma 079)
 * Edge function instagram-dm { conversations · thread · send } — login kiye account ka apna Instagram inbox.
 * Connect: Instagram OAuth → wapas ?code → instagram-auth (signed-in connect), purane app jaisa.
 */
export default function InstagramDMs() {
  const [state, setState] = useState("busy"); // off | busy | on
  const [problem, setProblem] = useState(null); // { text, connect }
  const [threads, setThreads] = useState([]);
  const [me, setMe] = useState({});
  const [open, setOpen] = useState({}); // thread id → messages
  const [reply, setReply] = useState({});
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setState("busy");
    const r = await invoke("admin", "instagram-dm", { action: "conversations" });
    if (r.error) {
      const reason = r.data?.reason;
      setProblem({ text: PROBLEM[reason] || errText(r.error), connect: !reason || reason === "reconnect" || reason === "token_expired" || /isn.?t connected/i.test(errText(r.error)) });
      return setState("off");
    }
    setProblem(null);
    setThreads(r.data?.threads || []);
    setMe(r.data?.me || {});
    setState("on");
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const code = sp.get("code");
    const back = sp.get("state");
    if (!code) {
      load();
      return;
    }
    // Instagram se wapas aaye — code ko is account se jodo
    let saved = "";
    try {
      saved = window.localStorage.getItem(STATE_KEY) || "";
      window.localStorage.removeItem(STATE_KEY);
    } catch {
      /* ignore */
    }
    window.history.replaceState(null, "", window.location.pathname);
    if (!saved || saved !== back) {
      setProblem({ text: "That Instagram sign-in didn’t start here — try Connect Instagram again.", connect: true });
      setState("off");
      return;
    }
    (async () => {
      setState("busy");
      const r = await invoke("admin", "instagram-auth", { code, redirect_uri: redirectUri() });
      if (r.error) {
        setProblem({ text: `Instagram sign-in failed: ${errText(r.error)}`, connect: true });
        return setState("off");
      }
      setToast("Instagram connected ✓");
      load();
    })();
  }, [load]);

  const connect = async () => {
    setState("busy");
    let ticket = "";
    const t = await rpc("admin", "ig_connect_begin");
    if (!t.error && t.data) ticket = String(t.data);
    const st = `instagram:${Math.random().toString(36).slice(2)}${ticket ? `:${ticket}` : ""}`;
    try {
      window.localStorage.setItem(STATE_KEY, st);
    } catch {
      /* ignore */
    }
    const p = new URLSearchParams({ client_id: INSTAGRAM_APP_ID, redirect_uri: redirectUri(), response_type: "code", scope: IG_SCOPES, state: st });
    window.location.href = `https://www.instagram.com/oauth/authorize/?${p.toString()}#weblink`;
  };

  const toggle = async (c) => {
    if (open[c.id]) return setOpen({ ...open, [c.id]: null });
    setOpen({ ...open, [c.id]: { loading: true } });
    const r = await invoke("admin", "instagram-dm", { action: "thread", conversation_id: c.id });
    setOpen((o) => ({ ...o, [c.id]: r.error ? { error: errText(r.error) } : { msgs: (r.data?.messages || []).slice().reverse() } }));
  };

  const send = async (e, c) => {
    e.preventDefault();
    const txt = (reply[c.id] || "").trim();
    if (!txt || !c.with_id) return;
    const r = await invoke("admin", "instagram-dm", { action: "send", recipient_id: c.with_id, text: txt });
    if (r.error) return setToast(errText(r.error));
    setReply({ ...reply, [c.id]: "" });
    setToast(`Reply sent to @${c.with_username || "user"}`);
    if (open[c.id]) {
      const t = await invoke("admin", "instagram-dm", { action: "thread", conversation_id: c.id });
      if (!t.error) setOpen((o) => ({ ...o, [c.id]: { msgs: (t.data?.messages || []).slice().reverse() } }));
    }
    load();
  };
  const mine = (m) => m.from && (String(m.from.id) === String(me.id) || m.from.username === me.username);

  return (
    <AdminShell>
      <InboxHead />
      <section className="ad-card ig-card">
        <h2 className="ad-h2">📸 Instagram DMs</h2>
        <p className="ig-sub">Connect your Instagram and your DMs open right here — reply to creators without leaving Geek OS. Invites you send also go out from this handle.</p>
        {state !== "on" ? (
          <div className="ig-cta">
            {problem && <p className="ig-prob">{problem.text}</p>}
            {(!problem || problem.connect) && (
              <button type="button" className="ad-btn ad-btn--primary" onClick={connect} disabled={state === "busy"}>
                {state === "busy" ? "Connecting…" : "📸 Connect Instagram"}
              </button>
            )}
            {problem && !problem.connect && (
              <button type="button" className="ad-btn ad-btn--ghost" onClick={load}>
                Try again
              </button>
            )}
          </div>
        ) : (
          <div className="ig-list">
            <p className="ig-ok">● Connected{me.username ? ` as @${me.username}` : ""}</p>
            {!threads.length && <p className="ig-sub">No conversations yet.</p>}
            {threads.map((c) => (
              <div key={c.id} className="ig-dm">
                <span className="ig-av">{String(c.with_username || "?").slice(0, 1).toUpperCase()}</span>
                <div className="ig-dm__main">
                  <p>
                    <button type="button" className="ig-name" onClick={() => toggle(c)} title="Show the chat">
                      <b>@{c.with_username || "user"}</b>
                    </button>{" "}
                    <em>· {ago(c.last_at || c.updated_time)}</em>
                  </p>
                  <p className="ig-dm__t">
                    {c.last_from_me ? "You: " : ""}
                    {c.last_text || ""}
                  </p>
                  {open[c.id] && (
                    <div className="ig-thread">
                      {open[c.id].loading && <p className="ig-sys">Loading…</p>}
                      {open[c.id].error && <p className="ig-sys">{open[c.id].error}</p>}
                      {(open[c.id].msgs || []).map((m) => (
                        <p key={m.id} className={mine(m) ? "ig-me" : "ig-them"}>
                          {m.message || (m.attachments ? "[attachment]" : "")}
                        </p>
                      ))}
                    </div>
                  )}
                  <form className="ig-reply" onSubmit={(e) => send(e, c)}>
                    <input className="ad-input" placeholder="Reply…" value={reply[c.id] || ""} onChange={(e) => setReply({ ...reply, [c.id]: e.target.value })} aria-label={`Reply to @${c.with_username || "user"}`} />
                    <button type="submit" className="ad-btn ad-btn--soft">
                      Send
                    </button>
                  </form>
                </div>
              </div>
            ))}
            <p className="ig-sub">Instagram allows replies within 24 hours of their last message.</p>
          </div>
        )}
      </section>
      {toast && <div className="ad-toast">{toast}</div>}
      <style>{`
        .ig-card { padding: 24px 22px 52px; }
        .ig-sub { margin-top: 9px; font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
        .ig-cta { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 46px; text-align: center; }
        .ig-prob { max-width: 520px; font-size: 13px; color: var(--ad-orange); }
        .ig-name { border: 0; background: none; padding: 0; font: inherit; color: inherit; cursor: pointer; }
        .ig-name:hover b { color: var(--ad-primary); }
        .ig-thread { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow-y: auto; margin-top: 10px; padding: 10px; border-radius: 12px; background: var(--ad-soft-2); }
        .ig-thread p { max-width: 80%; padding: 7px 11px; border-radius: 12px; font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; }
        .ig-me { align-self: flex-end; background: var(--ad-primary); color: #fff; }
        .ig-them { align-self: flex-start; background: #fff; border: 1px solid var(--ad-line); }
        .ig-sys { align-self: center; font-size: 12px; color: var(--ad-muted); }
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
