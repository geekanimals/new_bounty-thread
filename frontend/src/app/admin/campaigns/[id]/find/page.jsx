"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Overview from "../overview/page";
import { campaignById } from "@/components/admin/data";

const MATCHES = [
  { id: "smarty", name: "Smarty", handle: "@smartynikhil8", followers: "1,66,816", eng: "—", city: "Delhi", fit: "100%" },
  { id: "nafish", name: "Nafish Alam", handle: "@royalnafish", followers: "82,183", eng: "0.8%", city: "Patna", fit: "100%" },
  { id: "sonali", name: "Sonali Pahuja", handle: "@little_tanny03", followers: "67,674", eng: "3.4%", city: "Bengaluru", fit: "100%" },
  { id: "ashish", name: "Ashish Giri", handle: "@ashish.giri21", followers: "38,694", eng: "3.8%", city: "Delhi", fit: "96%" },
];
const ALL = [
  ...MATCHES,
  { id: "aisha", name: "Aisha Khan", handle: "@aisha.styles", followers: "24,100", eng: "6.4%", city: "Mumbai", fit: "88%" },
  { id: "meera", name: "Meera Iyer", handle: "@meera.makes", followers: "62,400", eng: "5.8%", city: "Bengaluru", fit: "84%" },
  { id: "kritika", name: "Kritika Rao", handle: "@kritikarao", followers: "11,900", eng: "8.9%", city: "Hyderabad", fit: "79%" },
];

/* Figma: Find matching creators — workspace ke upar right panel (Invite creators) */
export default function FindMatching() {
  const { id } = useParams();
  const router = useRouter();
  const c = campaignById(id);
  const [mode, setMode] = useState("match");
  const [show, setShow] = useState("Not invited yet");
  const [q, setQ] = useState("");
  const [invited, setInvited] = useState([]);
  const [toast, setToast] = useState("");

  const close = () => router.push(`/admin/campaigns/${c.id}/overview`);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  let rows = mode === "match" ? MATCHES : ALL.filter((r) => `${r.name} ${r.handle} ${r.city}`.toLowerCase().includes(q.trim().toLowerCase()));
  if (show === "Not invited yet") rows = rows.filter((r) => !invited.includes(r.id));
  if (show === "Invited") rows = rows.filter((r) => invited.includes(r.id));

  const invite = (r) => {
    setInvited((v) => (v.includes(r.id) ? v : [...v, r.id]));
    setToast(`🎯 Invite sent to ${r.name} — in-app, WhatsApp & email`);
  };
  const inviteAll = () => {
    const ids = rows.map((r) => r.id);
    setInvited((v) => [...new Set([...v, ...ids])]);
    setToast(`🎯 ${ids.length} creators invited`);
  };

  return (
    <>
      <Overview />
      <div className="fm-wrap" onClick={close}>
        <aside className="fm" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Invite creators">
          <button type="button" className="fm-x" onClick={close} aria-label="Close">
            ✕
          </button>
          <p className="fm-eye">Invite creators</p>
          <h2 className="fm-h">{c.name.split(" · ")[0]}</h2>
          <p className="fm-sub">Matched on your ideal creator profile. Invites go in-app, on WhatsApp and by email.</p>

          <div className="fm-stats">
            {[
              ["60", "Match your brief"],
              [String(invited.length), "Invited"],
              ["24", "New on Instagram"],
              ["5", "Off-platform invites"],
            ].map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>

          <div className="fm-bar">
            <button type="button" className={`ad-tab ${mode === "match" ? "is-on" : ""}`} onClick={() => setMode("match")}>
              ✨ Matching (60)
            </button>
            <button type="button" className={`ad-tab ${mode === "all" ? "is-on" : ""}`} onClick={() => setMode("all")}>
              🔎 Search all creators
            </button>
            <select className="ad-input fm-sel" value={show} onChange={(e) => setShow(e.target.value)} aria-label="Show">
              <option>Not invited yet</option>
              <option>Invited</option>
              <option>Everyone</option>
            </select>
            <button type="button" className="ad-btn ad-btn--primary fm-all" onClick={inviteAll} disabled={!rows.length}>
              Invite all shown
            </button>
          </div>
          {mode === "all" && <input className="ad-input fm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, @handle or city…" aria-label="Search all creators" autoFocus />}

          <div className="fm-table">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Followers</th>
                  <th>Engagement</th>
                  <th>City</th>
                  <th>Fit</th>
                  <th aria-label="Invite" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="fm-name">
                      {r.name} · {r.handle}
                    </td>
                    <td>{r.followers}</td>
                    <td>{r.eng}</td>
                    <td>{r.city}</td>
                    <td>
                      <span className="ad-badge ad-badge--green">{r.fit}</span>
                    </td>
                    <td>
                      {invited.includes(r.id) ? (
                        <span className="fm-done">✓ Invited</span>
                      ) : (
                        <button type="button" className="ad-btn ad-btn--primary fm-inv" onClick={() => invite(r)}>
                          🎯 Invite
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="fm-empty">Nobody here yet.</p>}
          </div>
        </aside>
      </div>
      {toast && <div className="ad-toast fm-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ad-input { appearance: none; -webkit-appearance: none; }
        .fm-wrap { position: fixed; inset: 0; z-index: 95; background: rgba(20,33,59,.28); animation: adFade .15s ease; }
        .fm { position: absolute; right: 0; top: 0; bottom: 0; width: min(820px, 100%); padding: 30px 30px 30px; overflow-y: auto; background: #fff; box-shadow: -20px 0 60px -30px rgba(20,33,59,.5); animation: fmIn .2s ease; }
        @keyframes fmIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
        .fm-x { position: absolute; right: 30px; top: 30px; width: 36px; height: 36px; border: 0; border-radius: 10px; background: var(--ad-soft); color: var(--ad-muted-2); font-size: 14px; }
        .fm-eye { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #8b92aa; }
        .fm-h { margin-top: 18px; font-family: var(--ad-head); font-size: 26px; font-weight: 800; letter-spacing: -0.9px; color: var(--ad-ink); }
        .fm-sub { margin-top: 18px; font-size: 12px; color: var(--ad-muted); }
        .fm-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--ad-line); }
        .fm-stats div { display: flex; flex-direction: column; padding: 18px 16px 16px; border-radius: 14px; background: var(--ad-soft-2); }
        .fm-stats strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; color: var(--ad-ink); }
        .fm-stats span { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .fm-bar { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; padding: 18px 0 38px; border-bottom: 1px solid var(--ad-line); }
        .fm-bar .ad-tab { height: 37px; }
        .fm-bar .ad-tab:not(.is-on) { color: #67718a; }
        .fm-sel { width: 137px; height: 45px; margin-left: 3px; padding: 0 12px; font-size: 14px; color: #293652; }
        .fm-all { height: 41px; padding: 0 16px; }
        .fm-q { margin-top: 14px; }
        .fm-table { margin: 18px -30px 0 0; overflow-x: auto; border-bottom: 1px solid var(--ad-line); padding-bottom: 14px; }
        .fm-table .ad-table th { background: none; padding: 14px 11px; }
        .fm-table .ad-table td { height: 70px; padding: 10px 11px; }
        .fm-name { font-weight: 700; }
        .fm-inv { height: 39px; padding: 0 16px; font-size: 13px; }
        .fm-done { font-size: 12px; font-weight: 800; color: var(--ad-green); }
        .fm-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--ad-muted); }
        .fm-toast { z-index: 130; }
        @media (max-width: 640px) {
          .fm { padding: 22px 16px; }
          .fm-x { right: 16px; top: 18px; }
          .fm-stats { grid-template-columns: 1fr 1fr; }
          .fm-bar { padding-bottom: 18px; }
          .fm-sel, .fm-all { flex: 1 1 45%; }
          .fm-table { margin-right: -16px; }
        }
      `}</style>
    </>
  );
}
