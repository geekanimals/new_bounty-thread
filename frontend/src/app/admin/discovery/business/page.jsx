"use client";

import { useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import DiscoveryHead from "@/components/admin/discovery/DiscoveryHead";

const ACCOUNTS = {
  kabirfoodtrail: { name: "Kabir Mehta", bio: "Delhi food trails, street food and honest reviews.", nums: ["41.2k", "612", "388", "2.8%"], posts: [[640, 31], [1280, 62], [1920, 93], [2560, 124]] },
  nishastories: { name: "Nisha Rao", bio: "Skincare that works on Indian skin. Mumbai.", nums: ["28.1k", "455", "302", "3.1%"], posts: [[910, 44], [1430, 70], [760, 28], [2210, 98]] },
};

/* Discovery → Business discovery (Figma 055) */
export default function DiscoveryBusiness() {
  const [user, setUser] = useState("");
  const [acc, setAcc] = useState("kabirfoodtrail");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };
  const search = (e) => {
    e.preventDefault();
    const u = user.trim().replace(/^@/, "").toLowerCase() || "kabirfoodtrail";
    if (ACCOUNTS[u]) {
      setAcc(u);
      setErr("");
    } else setErr(`@${u} isn’t a public Business or Creator account (or doesn’t exist).`);
  };
  const a = ACCOUNTS[acc];

  return (
    <AdminShell>
      <DiscoveryHead />
      <section className="dbz-card ad-card">
        <div className="dbz-top">
          <div>
            <h2 className="ad-h2">Instagram Business discovery</h2>
            <p className="dbz-sub">Type any public Business or Creator username — see their profile and latest posts.</p>
          </div>
          <span className="ad-badge">Searching with @geekanimals</span>
        </div>
        <form className="dbz-row" onSubmit={search}>
          <input className="ad-input dbz-q" placeholder="@kabirfoodtrail" value={user} onChange={(e) => setUser(e.target.value)} aria-label="Instagram username" />
          <button type="submit" className="ad-btn ad-btn--primary dbz-go">
            🔎 Search
          </button>
        </form>
        {err && <p className="dbz-err">{err}</p>}

        <div className="dbz-nums">
          {["Followers", "Following", "Posts", "Engagement"].map((l, i) => (
            <div key={l}>
              <strong>{a.nums[i]}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <p className="dbz-bio">
          <b>{a.name}</b>· <span>{a.bio}</span>
        </p>
        <div className="dbz-grid">
          {a.posts.map(([l, c], i) => (
            <a key={i} href={`https://instagram.com/${acc}`} target="_blank" rel="noreferrer" className="dbz-post">
              <span />
              <small>
                ❤️ {l} · 💬 {c}
              </small>
            </a>
          ))}
        </div>
        <div className="dbz-acts">
          <button type="button" className="ad-btn ad-btn--primary" onClick={() => flash(`${a.name} added to Geek OS creators`)}>
            Add to Geek OS
          </button>
          <Link href="/admin/campaigns" className="ad-btn ad-btn--ghost">
            Invite to a campaign
          </Link>
        </div>
      </section>
      {toast && <div className="ad-toast">✓ {toast}</div>}

      <style>{`
        .dbz-card { padding: 25px 22px 22px; }
        .dbz-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .dbz-top .ad-badge { margin-top: 9px; }
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
        .dbz-post span { display: block; aspect-ratio: 220 / 110; border-radius: 12px; background: #ebe7fc; }
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
