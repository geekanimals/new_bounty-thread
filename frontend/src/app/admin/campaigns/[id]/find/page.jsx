"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Overview from "../overview/page";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast, fmtNum } from "@/components/admin/campaign/live";

/* api row → table row (campaign_matches / creator_search dono) */
const toRow = (c) => ({
  id: c.member_id || c.username,
  member: c.member_id,
  handle: c.username ? "@" + c.username : "",
  name: c.name || (c.username ? "@" + c.username : "Creator"),
  followers: c.followers != null ? fmtNum(c.followers) : "—",
  eng: c.engagement != null ? Math.round(c.engagement * 10) / 10 + "%" : "—",
  city: [...new Set([c.city, c.region].filter(Boolean))].join(", ") || "—",
  fit: c.score != null ? `${c.score}%` : "—",
  state: c.state || "none",
});
const STATE_TXT = { invited: "✓ Invited", applied: "Applied", approved: "On the campaign", declined: "Declined", eligible: "Applied", sent_to_brand: "Applied" };

/* Figma: Find matching creators — workspace ke upar right panel (purana openInvitePanel) */
export default function FindMatching() {
  const { id } = useParams();
  const router = useRouter();
  const { c: camp } = useCampaign(id);
  const on = !!id && id !== "sample";
  const m = useRpc("admin", "api.campaign_matches", { p_campaign: id, p_limit: 60 }, { skip: !on });
  const ext = useRpc("admin", "api.list_external_invites", { p_campaign: id }, { skip: !on });
  const disc = useRpc("admin", "api.discover_external", { p_filters: {}, p_campaign: id, p_limit: 24 }, { skip: !on });
  const [mode, setMode] = useState("match");
  const [show, setShow] = useState("Not invited yet");
  const [q, setQ] = useState("");
  const [qq, setQq] = useState("");
  const [search, setSearch] = useState({ rows: [], loading: false, error: null });
  const [mine, setMine] = useState({}); // is session mein invite kiye (member → true)
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useToast();

  const close = () => router.push(`/admin/campaigns/${id}/overview`);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  });
  // 🔎 Search all — creator_search (platform), 350ms ruk ke
  useEffect(() => {
    const t = setTimeout(() => setQq(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (mode !== "all" || !on) return;
    let alive = true;
    setSearch((s) => ({ ...s, loading: true }));
    rpc("admin", "api.creator_search", { p_filters: { q: qq, source: "platform" }, p_page: 1, p_size: 24, p_campaign: id }).then((r) => {
      if (alive) setSearch({ rows: (r.data && r.data.rows) || [], loading: false, error: r.error });
    });
    return () => {
      alive = false;
    };
  }, [mode, qq, id, on]);

  const L = (Array.isArray(m.data) ? m.data : []).map(toRow);
  const invitedN = L.filter((r) => r.state === "invited" || mine[r.member]).length;
  const disN = (Array.isArray(disc.data) ? disc.data : []).filter((c) => !c.invited).length;
  const extN = Array.isArray(ext.data) ? ext.data.length : 0;
  const isInv = (r) => r.state !== "none" || mine[r.member];

  let rows = mode === "match" ? L : search.rows.map(toRow);
  if (show === "Not invited yet") rows = rows.filter((r) => !isInv(r));
  if (show === "Invited") rows = rows.filter((r) => isInv(r));

  /* invite_creator (on platform) — purane data-inv / csInvite jaisa */
  const invite = async (r, quiet) => {
    if (!r.member) return false;
    setBusy(r.id);
    const { error } = await rpc("admin", "api.invite_creator", { p_campaign: id, p_member: r.member, p_note: null });
    setBusy("");
    if (error) {
      if (!quiet) setToast(errText(error));
      return false;
    }
    setMine((v) => ({ ...v, [r.member]: true }));
    if (!quiet) setToast(`🎯 Invite sent to ${r.name} — in-app, WhatsApp & email`);
    return true;
  };
  const inviteAll = async () => {
    const list = rows.filter((r) => !isInv(r) && r.member);
    if (!list.length) return;
    if (!window.confirm(`Invite ${list.length} creator${list.length > 1 ? "s" : ""} to this campaign? Each gets it in the app, on WhatsApp and by email.`)) return;
    setBusy("all");
    let ok = 0;
    for (const r of list) if (await invite(r, true)) ok++;
    setBusy("");
    setToast(`🎯 ${ok} creator${ok === 1 ? "" : "s"} invited${ok < list.length ? ` · ${list.length - ok} couldn't be invited` : ""}`);
    m.reload(true);
  };

  const c = { name: camp?.name || "Campaign" };

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
              [m.loading ? "…" : String(L.length), "Match your brief"],
              [m.loading ? "…" : String(invitedN), "Invited"],
              [disc.loading ? "…" : String(disN), "New on Instagram"],
              [ext.loading ? "…" : String(extN), "Off-platform invites"],
            ].map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>

          <div className="fm-bar">
            <button type="button" className={`ga-tab ${mode === "match" ? "is-on" : ""}`} onClick={() => setMode("match")}>
              ✨ Matching ({L.length})
            </button>
            <button type="button" className={`ga-tab ${mode === "all" ? "is-on" : ""}`} onClick={() => setMode("all")}>
              🔎 Search all creators
            </button>
            <select className="ga-input fm-sel" value={show} onChange={(e) => setShow(e.target.value)} aria-label="Show">
              <option>Not invited yet</option>
              <option>Invited</option>
              <option>Everyone</option>
            </select>
            <button type="button" className="ga-btn ga-btn--primary fm-all" onClick={inviteAll} disabled={!rows.some((r) => !isInv(r) && r.member) || busy === "all"}>
              {busy === "all" ? "Inviting…" : "Invite all shown"}
            </button>
          </div>
          {mode === "all" && <input className="ga-input fm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, @handle or city…" aria-label="Search all creators" autoFocus />}

          <div className="fm-table">
            <table className="ga-table">
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
                      <span className="ga-badge ga-badge--green">{r.fit}</span>
                    </td>
                    <td>
                      {isInv(r) ? (
                        <span className="fm-done">{mine[r.member] ? "✓ Invited" : STATE_TXT[r.state] || "✓ Invited"}</span>
                      ) : (
                        <button type="button" className="ga-btn ga-btn--primary fm-inv" disabled={busy === r.id || !r.member} onClick={() => invite(r)}>
                          {busy === r.id ? "…" : "🎯 Invite"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="fm-empty">
                {(mode === "match" ? m.error : search.error)
                  ? errText(mode === "match" ? m.error : search.error)
                  : (mode === "match" ? m.loading : search.loading)
                  ? "Loading creators…"
                  : mode === "match" && !L.length
                  ? "No creator on the platform matches this brief yet. Widen the follower range or the ideal profile on the campaign, or search all creators."
                  : "Nobody here yet."}
              </p>
            )}
          </div>
        </aside>
      </div>
      {toast && <div className="ga-toast fm-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ga-input { appearance: none; -webkit-appearance: none; }
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
        .fm-bar .ga-tab { height: 37px; }
        .fm-bar .ga-tab:not(.is-on) { color: #67718a; }
        .fm-sel { width: 137px; height: 45px; margin-left: 3px; padding: 0 12px; font-size: 14px; color: #293652; }
        .fm-all { height: 41px; padding: 0 16px; }
        .fm-q { margin-top: 14px; }
        .fm-table { margin: 18px -30px 0 0; overflow-x: auto; border-bottom: 1px solid var(--ad-line); padding-bottom: 14px; }
        .fm-table .ga-table th { background: none; padding: 14px 11px; }
        .fm-table .ga-table td { height: 70px; padding: 10px 11px; }
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
