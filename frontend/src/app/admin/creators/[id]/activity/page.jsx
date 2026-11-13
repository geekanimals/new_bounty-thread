"use client";

import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";
import { useRpc, errText } from "@/lib/supabase";
import { agoTxt, fmtDateTime, cap1 } from "@/components/admin/creator/live";

/* purane actEvent jaisa — har event ki ek line */
const PAGE = (pg) => (pg ? cap1(String(pg).replace(/[-_]/g, " ")) : "");
const evText = (e) => {
  const pg = PAGE(e.page);
  if (e.event === "session_start") return "Opened the app";
  if (e.event === "page_view") return `Opened ${pg || "a page"}`;
  if (e.event === "time") return `Spent ${e.seconds >= 60 ? Math.round(e.seconds / 60) + " min" : (e.seconds || 0) + "s"} on ${pg || "a page"}`;
  if (e.event === "consent") return `Cookie choice: ${(e.detail && e.detail.choice) || ""}`;
  return cap1(String(e.event || "").replace(/_/g, " ")) + (pg ? ` · ${pg}` : "");
};

/* Creator profile → Activity tab (Figma: 4 numbers + Recent activity table) */
export default function CreatorActivityTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="activity">
      {() => <Act id={id} />}
    </CreatorDrawer>
  );
}

// creator_activity (30 din) — wahi jo purane 360 ke Activity tab mein tha
function Act({ id }) {
  const { data: A, error, loading } = useRpc("admin", "api.creator_activity", { p_member: id, p_days: 30 });
  if (error) return <p className="cpa-none">{errText(error) || "No activity."}</p>;
  if (loading && !A) return <p className="cpa-none">Loading activity…</p>;
  const a = A || {};
  const stats = [
    [a.last_seen ? agoTxt(a.last_seen) : "—", "Last active"],
    [String(a.active_days || 0), `Active days (${a.days || 30}d)`],
    [String(a.sessions || 0), "Visits"],
    [`${a.minutes || 0} min`, "Time spent"],
  ];
  const rows = (a.events || []).slice(0, 40).map((e) => [fmtDateTime(e.at), evText(e) + (e.place ? ` · 📍 ${e.place}` : "")]);
  return (
        <div className="cpa">
          <div className="cpa-nums">
            {stats.map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <h3>Recent activity</h3>
          <div className="cpa-wrap">
            <table className="ga-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>What</th>
                </tr>
              </thead>
              <tbody>
                {!rows.length && (
                  <tr>
                    <td colSpan={2}>Nothing recorded yet.</td>
                  </tr>
                )}
                {rows.map(([w, t], i) => (
                  <tr key={i}>
                    <td>{w}</td>
                    <td>{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <style>{`
            .cpa-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
            .cpa-nums div { display: flex; flex-direction: column; min-height: 105px; padding: 22px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpa-nums strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; }
            .cpa-nums span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
            .cpa h3 { margin-top: 26px; font-size: 13px; font-weight: 700; }
            .cpa-wrap { margin-top: 10px; overflow-x: auto; }
            .cpa .ga-table th { background: transparent; padding: 12px 11px; width: 46%; }
            .cpa .ga-table td { height: 48px; padding: 10px 11px; }
            .cpa-none { font-size: 13px; color: var(--ad-muted); }
            @media (max-width: 640px) {
              .cpa-nums { grid-template-columns: 1fr 1fr; gap: 8px; }
              .cpa-nums div { min-height: 0; padding: 14px; }
              .cpa-nums strong { font-size: 23px; }
              .cpa .ga-table td { white-space: normal; }
            }
          `}</style>
        </div>
  );
}
