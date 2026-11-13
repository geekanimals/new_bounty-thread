"use client";

import { useEffect, useState } from "react";
import { invoke, rpc, useRpc, errText } from "@/lib/supabase";
import InviteModal from "@/components/admin/discovery/InviteModal";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";

const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN"));

/* Discovery → Business discovery (Figma 055) — ig-discover {action:"lookup"} (purane app jaisa).
   Lookup apne aap creator search mein save karta hai; "Add to Geek OS" = import_creators (ek row). */
export default function DiscoveryBusiness() {
  const [user, setUser] = useState("");
  const [st, setSt] = useState({ data: null, busy: false });
  const [err, setErr] = useState("");
  const [inv, setInv] = useState(null);
  const [toast, setToast] = useState("");
  const { data: dc } = useRpc("admin", "my_discovery_connection", {});
  const igName = dc && ((dc.team && dc.team.ig_username) || dc.ig_username);

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2600);
  };
  const lookup = async (raw) => {
    const q = String(raw || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, "").toLowerCase();
    if (!/^[a-z0-9._]{2,30}$/.test(q)) return setErr("Type an Instagram username, e.g. virat.kohli");
    setErr("");
    setSt({ data: null, busy: true });
    const r = await invoke("admin", "ig-discover", { action: "lookup", username: q, media_limit: 24 });
    if (r.data && r.data.profile) return setSt({ data: r.data, busy: false });
    setSt({ data: null, busy: false });
    setErr((r.data && r.data.error) || errText(r.error) || "Couldn't reach Instagram.");
  };
  const search = (e) => {
    e.preventDefault();
    lookup(user);
  };
  // hashtag page ke "@account" se aaye → seedha dhundo (?u=)
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u");
    if (u) {
      setUser(u);
      lookup(u);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const P = st.data && st.data.profile;
  const posts = (st.data && st.data.posts) || [];
  const handle = P ? P.username || P.handle : "";
  const eng = P && P.followers ? Math.round((1000 * ((Number(P.avg_likes) || 0) + (Number(P.avg_comments) || 0))) / P.followers) / 10 : null;
  const add = async () => {
    const r = await rpc("admin", "api.import_creators", { p_rows: [{ handle, name: P.name || "", followers: P.followers != null ? String(P.followers) : undefined, engagement: eng != null ? String(eng) : undefined, bio: P.bio || "" }] });
    if (r.error) return flash("Couldn't add: " + errText(r.error));
    const d = r.data || {};
    flash(d.added ? `@${handle} added to your creator search` : `@${handle} is already on Geek OS / in your search`);
  };

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="dbz-card ga-card">
        <div className="dbz-top">
          <div>
            <h2 className="ga-h2">Instagram Business discovery</h2>
            <p className="dbz-sub">Type any public Business or Creator username — see their profile and latest posts.</p>
          </div>
          <span className="ga-badge">{igName ? `Searching with @${igName}` : "Searching with the team's Instagram"}</span>
        </div>
        <form className="dbz-row" onSubmit={search}>
          <input className="ga-input dbz-q" placeholder="@kabirfoodtrail" value={user} onChange={(e) => setUser(e.target.value)} aria-label="Instagram username" />
          <button type="submit" className="ga-btn ga-btn--primary dbz-go" disabled={st.busy}>
            {st.busy ? "Searching…" : "🔎 Search"}
          </button>
        </form>
        {err && <p className="dbz-err">{err}</p>}

        {st.busy && <p className="dbz-none">Looking up on Instagram…</p>}
        {!P && !st.busy && !err && <p className="dbz-none">Type a public Business or Creator username, e.g. virat.kohli</p>}
        {P && (
          <>
            <div className="dbz-nums">
              {[
                [fmt(P.followers), "Followers"],
                [fmt(P.follows), "Following"],
                [fmt(P.media_count), "Posts"],
                [eng != null ? eng + "%" : "—", "Engagement"],
              ].map(([n, l]) => (
                <div key={l}>
                  <strong>{n}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>
            <p className="dbz-bio">
              <a href={`https://instagram.com/${encodeURIComponent(handle)}`} target="_blank" rel="noopener noreferrer">
                <b>{P.name || "@" + handle}</b>
              </a>
              · <span>{P.bio || `@${handle}`}</span>
            </p>
            <div className="dbz-grid">
              {posts.slice(0, 8).map((m, i) => {
                const img = m.thumbnail_url || (m.media_type !== "VIDEO" && m.media_url) || "";
                return (
                  <a key={(m.id || "") + i} href={m.permalink || `https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" className="dbz-post">
                    <span>{img && <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />}</span>
                    <small>
                      ❤️ {fmt(m.like_count)} · 💬 {fmt(m.comments_count)}
                    </small>
                  </a>
                );
              })}
              {!posts.length && <p className="dbz-none">No posts shared.</p>}
            </div>
            <div className="dbz-acts">
              <button type="button" className="ga-btn ga-btn--primary" onClick={add}>
                Add to Geek OS
              </button>
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setInv({ handle, member_id: null, name: P.name })}>
                Invite to a campaign
              </button>
            </div>
          </>
        )}
      </section>
      {inv && (
        <InviteModal
          who={inv}
          onClose={() => setInv(null)}
          onDone={(m) => {
            setInv(null);
            flash(m);
          }}
        />
      )}
      {toast && <div className="ga-toast">✓ {toast}</div>}

      <style>{`
        .dbz-card { padding: 25px 22px 22px; }
        .dbz-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .dbz-top .ga-badge { margin-top: 9px; }
        .dbz-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .dbz-row { display: flex; gap: 10px; margin-top: 17px; }
        .dbz-q { width: 270px; height: 42px; }
        .dbz-go { height: 40px; margin-top: 1px; }
        .dbz-err { margin-top: 10px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .dbz-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; margin-top: 16px; }
        .dbz-nums div { display: flex; flex-direction: column; padding: 18px 16px 17px; border-radius: 14px; background: var(--ad-soft-2); }
        .dbz-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.2; }
        .dbz-nums span { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .dbz-bio { margin-top: 16px; font-size: 14px; }
        .dbz-bio b { font-weight: 700; }
        .dbz-bio span { margin-left: 4px; color: var(--ad-muted); }
        .dbz-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 15px; }
        .dbz-post { display: flex; flex-direction: column; padding: 20px 19px 20px; border-radius: 16px; border: 1px solid var(--ad-line); transition: border-color .15s; }
        .dbz-post:hover { border-color: #cfd2ee; }
        .dbz-post span { display: block; aspect-ratio: 220 / 110; overflow: hidden; border-radius: 12px; background: #ebe7fc; }
        .dbz-post span img { width: 100%; height: 100%; object-fit: cover; }
        .dbz-none { margin-top: 14px; font-size: 12.5px; color: var(--ad-muted); }
        .dbz-bio a:hover { color: var(--ad-primary); }
        .dbz-post small { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .dbz-acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
        @media (max-width: 1023px) { .dbz-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .dbz-card { padding: 18px 16px 20px; }
          .dbz-top { flex-direction: column; gap: 0; }
          .dbz-q { flex: 1; width: auto; min-width: 0; }
          .dbz-nums { grid-template-columns: 1fr 1fr; gap: 8px; }
          .dbz-grid { gap: 10px; }
          .dbz-post { padding: 12px; }
          .dbz-acts > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
