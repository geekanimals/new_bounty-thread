"use client";

import { useCallback, useEffect, useState } from "react";
import BrandShell from "@/components/brands/BrandShell";
import FacebookTabs, { FbGate } from "@/components/brands/FacebookTabs";
import { BrLoading, BrError, useToast } from "@/components/brands/BrandStates";
import { useFbPages, fbPosts, fbComments, fbReply, fbHide, fbDeleteComment, bShort, bWhen, bInitials, bAv, bGrad } from "@/services/brand";
import { Heart, Chat, Reply, EyeOff, Eye, Trash, Sparkle, Send, Check, ArrowRight } from "@/components/ui/Icons";

/**
 * /brands/facebook — Page ke posts + comments ka reply
 * (purana fbPosts: brand-facebook posts / scheduled, fbComments: comments, reply, hide, delete_comment).
 */
export default function FacebookPosts() {
  const fb = useFbPages();
  return (
    <BrandShell>
      <title>Facebook — Geek OS Brand</title>
      <FacebookTabs fb={fb} />
      <FbGate fb={fb}>{(pg) => <PostsPane key={pg.id} pg={pg} can={fb.can} />}</FbGate>
      <style>{`
        .fp { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 18px; align-items: start; }
        .fp-left__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
        .fp-left__head h2 { margin: 0; font-size: 15px; font-weight: 800; }
        .fp-posts { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .fp-post { width: 100%; display: flex; gap: 14px; padding: 10px; text-align: left; transition: border-color .2s, box-shadow .2s; }
        .fp-post:hover { border-color: var(--br-border-2); }
        .fp-post.is-on { border-color: var(--br-primary); box-shadow: 0 0 0 3px rgba(109,74,255,.12); background: #fbfaff; }
        .fp-post__img { width: 60px; height: 60px; border-radius: 10px; flex-shrink: 0; }
        .fp-post__img--sm { width: 40px; height: 40px; }
        .fp-post__txt { min-width: 0; }
        .fp-post__txt strong { display: block; font-size: 13px; font-weight: 700; line-height: 1.4; }
        .fp-post__txt small { display: block; margin: 3px 0 5px; font-size: 11.5px; color: var(--br-muted); }
        .fp-post__meta { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 700; }
        .fp-post__meta span { display: inline-flex; align-items: center; gap: 4px; }
        .fp-post__meta span:first-child svg { color: var(--br-red); }
        .fp-post__meta span:nth-child(2) svg { color: var(--br-primary); }
        .fp-post__meta em { font-style: normal; font-size: 11px; color: var(--br-orange); }

        .fp-right { overflow: hidden; }
        .fp-right__head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--br-border); }
        .fp-right__head div { flex: 1; min-width: 0; }
        .fp-right__head h2 { margin: 0; font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fp-right__head p { margin: 2px 0 0; font-size: 12px; color: var(--br-muted); }
        .fp-comments { list-style: none; margin: 0; padding: 0; }
        .fp-comments li { display: flex; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--br-border); }
        .fp-comments li:last-child { border-bottom: 0; }
        .fp-comments li.is-hidden { background: #f7f7fb; }
        .fp-comments li.is-hidden .fp-c__text { color: var(--br-faint); }
        .fp-c { flex: 1; min-width: 0; }
        .fp-c__top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 0; }
        .fp-c__top strong { font-size: 13px; font-weight: 700; }
        .fp-c__top small { font-size: 11.5px; color: var(--br-faint); }
        .fp-c__top .br-badge svg { margin-left: -2px; }
        .fp-c__text { margin: 4px 0 0; font-size: 13px; line-height: 1.5; color: var(--br-text); }
        .fp-c__reply { margin: 8px 0 0; padding: 8px 12px; border-left: 3px solid var(--br-primary); border-radius: 0 10px 10px 0; background: var(--br-lilac); font-size: 12.5px; line-height: 1.5; }
        .fp-c__reply b { margin-right: 6px; }
        .fp-box { display: flex; align-items: flex-end; gap: 8px; margin-top: 10px; }
        .fp-box textarea {
          flex: 1; min-width: 0; padding: 9px 12px; border: 1.5px solid var(--br-primary); border-radius: 12px;
          font-size: 13px; line-height: 1.5; resize: vertical; outline: none; box-shadow: 0 0 0 3px rgba(109,74,255,.1);
        }
        .fp-ai { width: 34px; height: 34px; flex-shrink: 0; border: 0; border-radius: 9px; background: var(--br-lilac); color: var(--br-primary); display: grid; place-items: center; }
        .fp-c__acts { display: flex; gap: 14px; margin: 8px 0 0; }
        .fp-c__acts button { display: inline-flex; align-items: center; gap: 5px; padding: 0; border: 0; background: none; font-size: 12px; font-weight: 600; color: var(--br-muted); }
        .fp-c__acts button:hover { color: var(--br-ink); }
        .fp-c__acts .is-reply { color: var(--br-primary); }
        .fp-c__acts .is-del { color: var(--br-red); }
        .fp-empty { justify-content: center; color: var(--br-muted); font-size: 13px; }

        @media (max-width: 1023px) {
          .fp { grid-template-columns: minmax(0, 1fr); }
          .fp-posts { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 4px; }
          .fp-posts li { flex: 0 0 300px; scroll-snap-align: start; }
          .fp-post { height: 100%; }
        }
        @media (max-width: 640px) {
          .fp-posts li { flex-basis: 82%; }
          .fp-right__head { flex-wrap: wrap; }
          .fp-right__head .br-btn { width: 100%; }
          .fp-comments li { padding: 14px; }
          .fp-box { flex-wrap: wrap; }
          .fp-box textarea { flex-basis: 100%; }
          .fp-box .br-btn { flex: 1; }
        }
              .fp-none { margin: 10px 0; font-size: 13px; color: var(--br-muted); }
        .fp-rep { margin-left: 38px; }
        .fp-c__acts button:disabled { opacity: .5; }
        .fp-post__txt strong { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
`}</style>
    </BrandShell>
  );
}

function PostsPane({ pg, can }) {
  const [filter, setFilter] = useState("all"); // all = published, sched = scheduled (purana 🗓 Scheduled)
  const [posts, setPosts] = useState({ list: [], loading: true, error: null, reconnect: false });
  const [active, setActive] = useState(null);
  const [cm, setCm] = useState({ list: [], loading: false, error: null });
  const [openReply, setOpenReply] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState("");
  const [toast, say] = useToast();

  const loadPosts = useCallback(async () => {
    setPosts((p) => ({ ...p, loading: true }));
    const r = await fbPosts(pg.id, filter === "sched");
    const L = r.error ? [] : (r.data && r.data.posts) || [];
    setPosts({ list: L, loading: false, error: r.error, reconnect: r.reconnect });
    setActive((a) => (L.some((p) => p.id === a) ? a : L[0] ? L[0].id : null));
  }, [pg.id, filter]);
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const post = posts.list.find((p) => p.id === active) || null;
  const loadComments = useCallback(async () => {
    if (!active || filter === "sched") return setCm({ list: [], loading: false, error: null });
    setCm((c) => ({ ...c, loading: true }));
    const r = await fbComments(pg.id, active);
    setCm({ list: r.error ? [] : (r.data && r.data.comments) || [], loading: false, error: r.error });
  }, [pg.id, active, filter]);
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const act = async (key, f, ok) => {
    setBusy(key);
    const r = await f();
    setBusy("");
    say(r.error ? r.error.message : ok);
    if (!r.error) loadComments();
    return r;
  };
  const send = async (c) => {
    const text = (drafts[c.id] || "").trim();
    if (!text) return;
    const r = await act("re" + c.id, () => fbReply(pg.id, c.id, text), "Replied ✓");
    if (!r.error) {
      setOpenReply(null);
      setDrafts({ ...drafts, [c.id]: "" });
    }
  };
  const del = (c) => {
    if (!window.confirm("Delete this comment?")) return;
    act("dc" + c.id, () => fbDeleteComment(pg.id, c.id), "Deleted ✓");
  };
  const hide = (c) => act("hd" + c.id, () => fbHide(pg.id, c.id, !c.hidden), !c.hidden ? "Hidden ✓ — only the person and their friends see it" : "Visible again ✓");

  // ek comment (reply ho to chhota)
  const one = (c, reply) => (
    <li key={c.id} className={`${c.hidden ? "is-hidden" : ""} ${reply ? "fp-rep" : ""}`}>
      <span className="br-av br-av--sm" style={{ background: bAv(c.from) }}>
        {bInitials(c.from)}
      </span>
      <div className="fp-c">
        <p className="fp-c__top">
          <strong>{c.from}</strong>
          <small>
            {bWhen(c.at)}
            {c.likes ? ` · 👍 ${c.likes}` : ""}
          </small>
          {c.hidden && <span className="br-badge br-badge--grey">Hidden</span>}
          {c.from_page && <span className="br-badge br-badge--green">Your Page</span>}
        </p>
        <p className="fp-c__text">{c.message}</p>

        {openReply === c.id && (
          <div className="fp-box">
            <textarea rows={2} maxLength={2000} value={drafts[c.id] || ""} onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })} placeholder={`Reply as ${pg.name}…`} autoFocus />
            <button type="button" className="fp-ai" title="Write with AI" aria-label="Write reply with AI" onClick={() => say("Coming soon — AI replies.")}>
              <Sparkle size={14} />
            </button>
            <button type="button" className="br-btn br-btn--primary br-btn--sm" disabled={!(drafts[c.id] || "").trim() || busy === "re" + c.id} onClick={() => send(c)}>
              <Send size={12} /> Reply
            </button>
          </div>
        )}

        {can && (
          <p className="fp-c__acts">
            {!reply && (
              <button type="button" className="is-reply" onClick={() => setOpenReply(openReply === c.id ? null : c.id)}>
                <Reply size={12} /> {openReply === c.id ? "Cancel" : "Reply"}
              </button>
            )}
            {!c.from_page && (
              <button type="button" disabled={!!busy} onClick={() => hide(c)}>
                {c.hidden ? <Eye size={12} /> : <EyeOff size={12} />} {c.hidden ? "Unhide" : "Hide"}
              </button>
            )}
            <button type="button" className="is-del" disabled={!!busy} onClick={() => del(c)}>
              <Trash size={12} /> Delete
            </button>
          </p>
        )}
      </div>
    </li>
  );

  if (posts.error && !posts.list.length) return <BrError error={posts.error.message} onRetry={loadPosts} />;

  return (
    <div className="fp">
      {/* Posts list */}
      <section className="fp-left">
        <div className="fp-left__head">
          <h2>{filter === "sched" ? "Scheduled posts" : "Recent posts"}</h2>
          <div className="br-seg">
            <button type="button" className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>
              Published
            </button>
            <button type="button" className={filter === "sched" ? "is-on" : ""} onClick={() => setFilter("sched")}>
              Scheduled
            </button>
          </div>
        </div>
        {posts.loading ? (
          <BrLoading rows={4} />
        ) : !posts.list.length ? (
          <p className="fp-none">{filter === "sched" ? "Nothing scheduled." : "No posts yet — create one in Create post."}</p>
        ) : (
          <ul className="fp-posts" data-scroll>
            {posts.list.map((p) => (
              <li key={p.id}>
                <button type="button" className={`br-card fp-post ${p.id === active ? "is-on" : ""}`} onClick={() => setActive(p.id)}>
                  <span className="fp-post__img" style={{ background: p.image ? `center / cover no-repeat url("${p.image}")` : bGrad(p.id) }} />
                  <span className="fp-post__txt">
                    <strong>{p.message || "(no text)"}</strong>
                    <small>{filter === "sched" ? `Goes live ${bWhen((p.scheduled_at || 0) * 1000)}` : bWhen(p.at)}</small>
                    {filter !== "sched" && (
                      <span className="fp-post__meta">
                        <span>
                          <Heart size={12} /> {bShort(p.reactions)}
                        </span>
                        <span>
                          <Chat size={12} /> {bShort(p.comments)}
                        </span>
                        {p.reach != null && <span>{bShort(p.reach)} reach</span>}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comments */}
      <section className="br-card fp-right">
        {post ? (
          <>
            <header className="fp-right__head">
              <span className="fp-post__img fp-post__img--sm" style={{ background: post.image ? `center / cover no-repeat url("${post.image}")` : bGrad(post.id) }} />
              <div>
                <h2>{(post.message || "Post").split("\n")[0].slice(0, 80)}</h2>
                <p>{filter === "sched" ? "Scheduled — comments open once it’s live" : `${post.comments} comments · ${post.shares || 0} shares`}</p>
              </div>
              {post.link && (
                <a href={post.link} target="_blank" rel="noopener noreferrer" className="br-btn br-btn--ghost br-btn--sm">
                  Open on Facebook <ArrowRight size={13} />
                </a>
              )}
            </header>

            {cm.loading ? (
              <BrLoading rows={3} />
            ) : cm.error ? (
              <BrError error={cm.error.message} onRetry={loadComments} />
            ) : (
              <ul className="fp-comments">
                {cm.list.map((c) => [one(c, false), ...(c.replies || []).map((x) => one(x, true))])}
                {filter !== "sched" && cm.list.length === 0 && <li className="fp-empty">No comments yet.</li>}
              </ul>
            )}
          </>
        ) : (
          <p className="fp-none">{posts.loading ? "Loading…" : "Pick a post to see its comments."}</p>
        )}
      </section>
      {toast}
      {busy && !toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> Working…
        </div>
      )}


    </div>
  );
}
