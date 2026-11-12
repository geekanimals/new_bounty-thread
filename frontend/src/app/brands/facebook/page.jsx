"use client";

import { useState } from "react";
import BrandShell from "@/components/brands/BrandShell";
import FacebookTabs from "@/components/brands/FacebookTabs";
import { FB_POSTS, FB_COMMENTS } from "@/components/brands/data";
import { Heart, Chat, Reply, EyeOff, Eye, Trash, Sparkle, Send, Check, ArrowRight } from "@/components/ui/Icons";

// AI wala chhota reply (dummy)
const AI_REPLY = {
  Question: "Hi! Yes — the Glow Kit is oil-free and works well for oily skin. Use code GLOW20 for 20% off 💖",
  Complaint: "Hi, sorry about this! Please DM us your order number and we’ll fix it today.",
  default: "Thank you so much! We’ve passed this on to our team 💖",
};

/** /brands/facebook — Page ke posts + comments ka reply */
export default function FacebookPosts() {
  const [filter, setFilter] = useState("reply");
  const [active, setActive] = useState(FB_POSTS[0].id);
  // har post ke comments alag (dummy: sab post par same list se shuru)
  const [byPost, setByPost] = useState(() => Object.fromEntries(FB_POSTS.map((p) => [p.id, FB_COMMENTS.map((c) => ({ ...c }))])));
  const [openReply, setOpenReply] = useState(2);
  const [drafts, setDrafts] = useState({ 2: FB_COMMENTS.find((c) => c.id === 2).draft });

  const posts = filter === "reply" ? FB_POSTS.filter((p) => p.needReply > 0) : FB_POSTS;
  const post = FB_POSTS.find((p) => p.id === active) || posts[0];
  const comments = byPost[post.id];
  // post ke 'need reply' mein se jitne reply ho gaye, utne kam
  const pending = Math.max(0, post.needReply - comments.filter((c) => c.replied).length);

  const update = (id, patch) => setByPost((b) => ({ ...b, [post.id]: b[post.id].map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const remove = (id) => setByPost((b) => ({ ...b, [post.id]: b[post.id].filter((c) => c.id !== id) }));
  const send = (c) => {
    const text = (drafts[c.id] || "").trim();
    if (!text) return;
    update(c.id, { replied: text });
    setOpenReply(null);
  };

  return (
    <BrandShell>
      <title>Facebook — Geek OS Brand</title>
      <FacebookTabs />

      <div className="fp">
        {/* Posts list */}
        <section className="fp-left">
          <div className="fp-left__head">
            <h2>Recent posts</h2>
            <div className="br-seg">
              <button type="button" className={filter === "all" ? "is-on" : ""} onClick={() => setFilter("all")}>
                All
              </button>
              <button type="button" className={filter === "reply" ? "is-on" : ""} onClick={() => setFilter("reply")}>
                Needs reply {FB_POSTS.reduce((s, p) => s + p.needReply, 0)}
              </button>
            </div>
          </div>
          <ul className="fp-posts" data-scroll>
            {posts.map((p) => (
              <li key={p.id}>
                <button type="button" className={`br-card fp-post ${p.id === post.id ? "is-on" : ""}`} onClick={() => setActive(p.id)}>
                  <span className="fp-post__img" style={{ background: p.g }} />
                  <span className="fp-post__txt">
                    <strong>{p.title}</strong>
                    <small>{p.when}</small>
                    <span className="fp-post__meta">
                      <span>
                        <Heart size={12} /> {p.likes}
                      </span>
                      <span>
                        <Chat size={12} /> {p.comments}
                      </span>
                      {p.needReply > 0 && <em>{p.needReply} to reply</em>}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Comments */}
        <section className="br-card fp-right">
          <header className="fp-right__head">
            <span className="fp-post__img fp-post__img--sm" style={{ background: post.g }} />
            <div>
              <h2>{post.title.split(" ✨")[0].split(".")[0]}</h2>
              <p>
                {post.comments} comments · {pending} need a reply
              </p>
            </div>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="br-btn br-btn--ghost br-btn--sm">
              Open on Facebook <ArrowRight size={13} />
            </a>
          </header>

          <ul className="fp-comments">
            {comments.map((c) => (
              <li key={c.id} className={c.hidden ? "is-hidden" : ""}>
                <span className="br-av br-av--sm" style={{ background: c.av }}>
                  {c.initials}
                </span>
                <div className="fp-c">
                  <p className="fp-c__top">
                    <strong>{c.name}</strong>
                    <small>{c.time}</small>
                    {c.hidden ? (
                      <span className="br-badge br-badge--grey">Hidden</span>
                    ) : c.tag && c.tag !== "Hidden" ? (
                      <span className={`br-badge br-badge--${c.tone}`}>{c.tag}</span>
                    ) : null}
                    {c.replied && (
                      <span className="br-badge br-badge--green">
                        <Check size={10} /> Replied
                      </span>
                    )}
                  </p>
                  <p className="fp-c__text">{c.text}</p>

                  {c.replied && (
                    <p className="fp-c__reply">
                      <b>Nykaa</b> {c.replied}
                    </p>
                  )}

                  {openReply === c.id && !c.replied && (
                    <div className="fp-box">
                      <textarea
                        rows={2}
                        value={drafts[c.id] || ""}
                        onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })}
                        placeholder={`Reply to ${c.name}…`}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="fp-ai"
                        title="Write with AI"
                        aria-label="Write reply with AI"
                        onClick={() => setDrafts({ ...drafts, [c.id]: AI_REPLY[c.tag] || AI_REPLY.default })}
                      >
                        <Sparkle size={14} />
                      </button>
                      <button type="button" className="br-btn br-btn--primary br-btn--sm" disabled={!(drafts[c.id] || "").trim()} onClick={() => send(c)}>
                        <Send size={12} /> Reply
                      </button>
                    </div>
                  )}

                  <p className="fp-c__acts">
                    {!c.replied && (
                      <button type="button" className="is-reply" onClick={() => setOpenReply(openReply === c.id ? null : c.id)}>
                        <Reply size={12} /> {openReply === c.id ? "Cancel" : "Reply"}
                      </button>
                    )}
                    <button type="button" onClick={() => update(c.id, { hidden: !c.hidden })}>
                      {c.hidden ? <Eye size={12} /> : <EyeOff size={12} />} {c.hidden ? "Unhide" : "Hide"}
                    </button>
                    <button type="button" className="is-del" onClick={() => remove(c.id)}>
                      <Trash size={12} /> Delete
                    </button>
                  </p>
                </div>
              </li>
            ))}
            {comments.length === 0 && <li className="fp-empty">No comments left on this post.</li>}
          </ul>
        </section>
      </div>

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
      `}</style>
    </BrandShell>
  );
}
