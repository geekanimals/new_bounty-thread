"use client";

import { useState } from "react";
import { invoke, useRpc, errText } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));
const ago = (t) => {
  if (!t) return "";
  const d = Math.round((Date.now() - new Date(t).getTime()) / 86400000);
  return d < 1 ? "today" : d < 7 ? d + "d ago" : d < 60 ? Math.round(d / 7) + "w ago" : Math.round(d / 30) + "mo ago";
};

/* Discovery → Hashtag search (Figma 054) — ig-discover {action:"hashtag", edge:"both"} (purane app jaisa) */
export default function DiscoveryHashtag() {
  const [tag, setTag] = useState("");
  const [mode, setMode] = useState("top");
  const [st, setSt] = useState({ data: null, busy: false, error: "" });
  // kis Instagram se search ho raha hai (team ka Facebook connection)
  const { data: dc } = useRpc("admin", "my_discovery_connection", {});
  const igName = dc && ((dc.team && dc.team.ig_username) || dc.ig_username);

  const search = async (e) => {
    e?.preventDefault();
    const q = tag.trim().replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
    if (!/^[\p{L}\p{N}_]{2,60}$/u.test(q)) return setSt((s) => ({ ...s, error: "Type a hashtag — letters, numbers or _ only." }));
    setSt({ data: null, busy: true, error: "" });
    const r = await invoke("admin", "ig-discover", { action: "hashtag", tag: q, edge: "both" });
    if (r.error || !r.data) return setSt({ data: null, busy: false, error: errText(r.error) || "Couldn't reach Instagram." });
    setSt({ data: r.data, busy: false, error: "" });
  };
  const d = st.data;
  const posts = d ? (mode === "recent" ? d.recent || [] : d.posts || []) : [];

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="dg-card ga-card">
        <div className="dg-top">
          <div>
            <h2 className="ga-h2">Hashtag search</h2>
            <p className="dg-sub">See the top and most recent public posts using a hashtag on Instagram.</p>
          </div>
          <span className="ga-badge">{igName ? `Searching with @${igName}` : "Searching with the team's Instagram"}</span>
        </div>
        <form className="dg-row" onSubmit={search}>
          <input className="ga-input dg-q" placeholder="#diwalidecor" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Hashtag" />
          <div className="dg-mode" role="tablist">
            {[
              ["top", "Top posts"],
              ["recent", "Most recent"],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                className={`ga-tab ${mode === k ? "is-on" : ""}`}
                onClick={() => setMode(k)}
              >
                {l}
              </button>
            ))}
          </div>
          <button type="submit" className="ga-btn ga-btn--primary dg-go" disabled={st.busy}>
            {st.busy ? "Searching…" : "🔎 Search"}
          </button>
        </form>
        <p className="dg-note">
          <span>ℹ️</span> Meta allows 30 different hashtags per 7 days for each connected account.
          {" "}Searching the same hashtag again is free.
        </p>
        {st.error && <p className="dg-empty">{st.error}</p>}
        {d && !!(d.handles || []).length && (
          <p className="dg-handles">
            Accounts tagged in these posts:{" "}
            {d.handles.slice(0, 30).map((h) => (
              <a key={h} href={`/admin/discovery/business?u=${encodeURIComponent(h)}`}>
                @{h}
              </a>
            ))}
          </p>
        )}
        <div className="dg-grid">
          {posts.map((m, i) => {
            const vid = m.media_type === "VIDEO";
            const img = m.thumbnail_url || (!vid && m.media_url) || "";
            return (
              <div key={(m.id || m.permalink || "") + i} className="dg-post">
                <span className="dg-img">{img && <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />}</span>
                <strong>{m.caption ? String(m.caption).slice(0, 40) : vid ? "▶ Reel" : "📷 Post"}</strong>
                <small>
                  ❤️ {fmt(m.like_count)} · 💬 {fmt(m.comments_count)}
                  {m.timestamp ? ` · ${ago(m.timestamp)}` : ""}
                </small>
                {m.permalink && (
                  <a href={m.permalink} target="_blank" rel="noopener noreferrer">
                    Open post ↗
                  </a>
                )}
              </div>
            );
          })}
        </div>
        {st.busy && <p className="dg-empty">Searching Instagram…</p>}
        {d && !posts.length && <p className="dg-empty">{mode === "recent" ? "No recent posts." : "No top posts."}</p>}
        {!d && !st.busy && !st.error && <p className="dg-empty">Type a hashtag — e.g. diwalidecor, delhifoodblogger, skincare.</p>}
        {d && <p className="dg-empty">Instagram doesn&apos;t say who posted a hashtag post — open a post to see the creator.</p>}
      </section>

      <style>{`
        .dg-card { padding: 25px 22px 44px; }
        .dg-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .dg-top .ga-badge { margin-top: 9px; }
        .dg-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .dg-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 17px; }
        .dg-q { width: 270px; height: 44px; margin-top: 10px; }
        .dg-mode { display: flex; gap: 8px; }
        .dg-mode .ga-tab:not(.is-on) { color: #67718a; }
        .dg-go { height: 42px; margin-top: 12px; }
        .dg-note { display: flex; align-items: center; gap: 10px; margin-top: 20px; padding: 12px 15px; border-radius: 12px; background: #fff7e8; border: 1px solid #f5dfb5; font-size: 12px; color: #986016; }
        .dg-note b { font-weight: 700; }
        .dg-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 17px; }
        .dg-post { display: flex; flex-direction: column; padding: 20px 19px 20px; border-radius: 16px; border: 1px solid var(--ad-line); }
        .dg-img { display: block; aspect-ratio: 220 / 120; overflow: hidden; border-radius: 12px; background: #ebe7fc; margin-bottom: 12px; }
        .dg-img img { width: 100%; height: 100%; object-fit: cover; }
        .dg-post strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dg-empty { margin-top: 14px; font-size: 12.5px; color: var(--ad-muted); }
        .dg-handles { margin-top: 14px; font-size: 12.5px; color: var(--ad-muted); line-height: 1.8; }
        .dg-handles a { margin-right: 8px; font-weight: 700; color: #6151ea; }
        .dg-post strong { font-size: 14px; font-weight: 700; }
        .dg-post small { margin-top: 2px; font-size: 12px; color: var(--ad-muted); }
        .dg-post a { margin-top: 3px; font-size: 14px; font-weight: 800; color: #6151ea; }
        @media (max-width: 1023px) { .dg-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .dg-card { padding: 18px 16px 20px; }
          .dg-top { flex-direction: column; gap: 0; }
          .dg-q { width: 100%; margin-top: 0; }
          .dg-go { margin-top: 0; margin-left: auto; }
          .dg-note { align-items: flex-start; }
          .dg-grid { gap: 10px; }
          .dg-post { padding: 12px; }
        }
      `}</style>
    </AdminShell>
  );
}
