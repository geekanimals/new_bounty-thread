"use client";

import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";
import { useRpc } from "@/lib/supabase";
import { kNum, fmtDay } from "@/components/admin/creator/live";

/* Creator profile → Instagram tab (Figma: 4 numbers, bio, 6 posts, accounts)
   Data: admin_creator_profile.instagram + creator_ig_accounts (saare connected accounts) */
export default function CreatorInstagramTab() {
  const { id } = useParams();
  const { data: accts } = useRpc("admin", "api.creator_ig_accounts", { p_member: id }, { skip: !id });
  return (
    <CreatorDrawer id={id} tab="instagram">
      {(p) =>
        !p.igUser ? (
          <p className="cpi-none">Instagram not connected yet.</p>
        ) : (
        <div className="cpi">
          <div className="cpi-nums">
            {[
              [p.ig.followers, "Followers"],
              [p.ig.following, "Following"],
              [p.ig.posts, "Posts"],
              [p.ig.eng, "Engagement"],
            ].map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <p className="cpi-line">
            <a href={`https://instagram.com/${encodeURIComponent(p.igUser)}`} target="_blank" rel="noopener noreferrer">
              <b>{p.handle}</b>
            </a>
            · {p.ig.type} · connected {p.ig.connected} · last synced {p.ig.synced}
          </p>
          {p.ig.bio && <p className="cpi-bio">{p.ig.bio}</p>}
          <div className="cpi-posts">
            {p.ig.media.slice(0, 6).map((m, i) => (
              <a key={i} href={m.permalink || `https://instagram.com/${p.igUser}`} target="_blank" rel="noopener noreferrer" className="cpi-post" aria-label={`Post ${i + 1}, ${m.likes || 0} likes`}>
                <span>{m.img && <img src={m.img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />}</span>
                <small>
                  ❤️ {kNum(m.likes || 0)} · 💬 {kNum(m.comments || 0)}
                </small>
              </a>
            ))}
            {!p.ig.media.length && <p className="cpi-none">No recent posts synced.</p>}
          </div>
          <h3 className="cpi-h">Instagram accounts</h3>
          {(accts || []).map((a) => (
            <div key={a.ig_user_id || a.username} className="cpi-acc">
              {a.profile_picture_url ? <img className="cpi-ic" src={a.profile_picture_url} alt="" referrerPolicy="no-referrer" /> : <span className="cpi-ic">📸</span>}
              <div>
                <strong>@{a.username}</strong>
                <small>
                  {[a.active ? "Active" : "Linked", a.followers != null ? `${kNum(a.followers)} followers` : "", a.posts != null ? `${a.posts} posts` : "", `added ${fmtDay(a.connected_at)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </div>
              {a.active && <span className="ga-badge ga-badge--green">Active</span>}
            </div>
          ))}
          <style>{`
            .cpi-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; }
            .cpi-nums div { display: flex; flex-direction: column; padding: 16px 16px 15px; border-radius: 14px; background: var(--ad-soft-2); }
            .cpi-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.2; }
            .cpi-nums span { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
            .cpi-line { margin-top: 13px; font-size: 12px; line-height: 1.35; color: var(--ad-ink); }
            .cpi-line b { font-weight: 700; }
            .cpi-bio { margin-top: 1px; font-size: 12px; line-height: 1.35; color: var(--ad-muted); }
            .cpi-posts { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-top: 13px; }
            .cpi-post { display: flex; flex-direction: column; overflow: hidden; border-radius: 13px; border: 1px solid var(--ad-line); transition: transform .15s; }
            .cpi-post:hover { transform: translateY(-2px); }
            .cpi-post span { display: block; aspect-ratio: 117 / 80; background: #ebe7fc; overflow: hidden; }
            .cpi-post span img { width: 100%; height: 100%; object-fit: cover; }
            .cpi-none { font-size: 13px; color: var(--ad-muted); }
            .cpi-acc + .cpi-acc { margin-top: 8px; }
            img.cpi-ic { object-fit: cover; }
            .cpi-post small { padding: 6px 7px 7px; font-size: 12px; color: var(--ad-muted); }
            .cpi-h { margin-top: 24px; font-size: 13px; font-weight: 700; }
            .cpi-acc { display: flex; align-items: center; gap: 14px; margin-top: 14px; padding: 14px 14px 14px 13px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpi-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; }
            .cpi-acc div { flex: 1; min-width: 0; }
            .cpi-acc strong { display: block; font-size: 14px; font-weight: 700; }
            .cpi-acc small { display: block; margin-top: 4px; font-size: 12px; color: #8791a7; }
            @media (max-width: 640px) {
              .cpi-nums { grid-template-columns: 1fr 1fr; gap: 8px; }
              .cpi-posts { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
              .cpi-acc { flex-wrap: wrap; }
            }
          `}</style>
        </div>
        )
      }
    </CreatorDrawer>
  );
}
