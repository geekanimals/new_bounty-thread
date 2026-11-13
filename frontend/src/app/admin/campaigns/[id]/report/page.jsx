"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, MiniStats, Note, TableState, useToast, downloadFile, num } from "@/components/admin/campaign2/kit";
import { useRpc } from "@/lib/supabase";

/*
 * 📈 Campaign report — purane bpAnalyticsHtml / bpDownloadReport jaisa.
 * Data: api.campaign_analytics(p_campaign) → { campaign, totals, creators[{ creator, posts[{ media_type, permalink, stats }], totals }] }
 * Har total sirf neeche wale creators se jodta hai (kabhi andaza nahi).
 */
const handleOf = (r) => {
  const c = r.creator || {};
  return String(c.username || c.handle || r.handle || r.applied_profile || "").replace(/^@/, "");
};
const KIND = { REELS: "Reel", REEL: "Reel", VIDEO: "Reel", IMAGE: "Post", CAROUSEL_ALBUM: "Carousel", STORY: "Story" };

export default function CampaignReport() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_analytics", { p_campaign: id }, { skip: !id || id === "sample" });
  const a = data || {};
  const t = a.totals || {};
  const rows = a.creators || [];
  const N = rows.length;
  const sum = (k) => {
    let n = 0,
      v = 0;
    rows.forEach((r) => {
      const x = (r.totals || {})[k];
      if (x != null && x !== "") {
        n++;
        v += +x || 0;
      }
    });
    return { v: n ? v : null, n };
  };
  const views = sum("views"),
    reach = sum("reach");
  // engagement sirf un creators par jinke numbers hain
  let eNum = 0,
    eFol = 0;
  rows.forEach((r) => {
    const x = r.totals || {},
      f = +(r.creator || {}).followers || 0;
    if (f > 0 && (x.likes != null || x.comments != null)) {
      eFol += f;
      eNum += (+x.likes || 0) + (+x.comments || 0) + (+x.shares || 0) + (+x.saves || 0);
    }
  });
  const er = eFol ? ((100 * eNum) / eFol).toFixed(1) + "%" : "—";
  const cov = (n) => (N ? `from ${n} of ${N} creator${N > 1 ? "s" : ""}` : "");

  // ek row har post ki (Figma)
  const posts = rows.flatMap((r) => {
    const nm = (r.creator || {}).name || (handleOf(r) ? "@" + handleOf(r) : "Creator");
    return (r.posts || []).map((p, i) => ({ p, nm, key: `${r.participation_id || r.invite_id}-${i}` }));
  });

  const download = () => {
    const c = a.campaign || {};
    const head = ["Instagram", "Name", "Profile link", "On Geek OS", "Followers", "Post type", "Post link", "Posted on", "Views", "Reach", "Likes", "Comments", "Shares", "Saves", "Numbers from", "Status"];
    const lines = [];
    rows.forEach((r) => {
      const cr = r.creator || {},
        h = handleOf(r);
      (r.posts || []).forEach((p) => {
        const s = p.stats || {};
        lines.push([h ? "@" + h : "", cr.name || "", h ? `https://instagram.com/${h}` : "", r.on_sheet || r.not_connected || cr.followers == null ? "Not yet" : "Yes", cr.followers ?? "", p.media_type, p.permalink || "", p.posted_at ? new Date(p.posted_at).toLocaleDateString("en-IN") : "", s.views ?? "", s.reach ?? "", s.likes ?? "", s.comments ?? "", s.shares ?? "", s.saves ?? "", s.source === "public" ? "public profile" : s.source === "screenshot" ? "screenshot" : s.source === "manual" ? "typed in" : "Instagram insights", r.stage]);
      });
    });
    const tot = [["views", "Views"], ["reach", "Reach"], ["likes", "Likes"], ["comments", "Comments"], ["shares", "Shares"], ["saves", "Saves"]].map(([k, l]) => {
      const s = sum(k);
      return [l, s.v ?? "", `from ${s.n} of ${N} creators`];
    });
    downloadFile(`${(c.name || "campaign").replace(/[^\w-]+/g, "_")}_report.csv`, [[`${c.name || "Campaign"} — report`], [c.brand || ""], [], ["Creators live", t.creators_live ?? ""], ["Posts", t.posts ?? ""], ...tot, [], head, ...lines]);
    show("Campaign report downloaded");
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="report" />

      <Panel
        title="📈 Campaign report"
        sub="Every creator who posted, with their numbers. Updates on its own as Instagram shares insights."
        actions={
          <button type="button" className="ga-btn ga-btn--primary" onClick={download} disabled={!rows.length}>
            ⬇️ Download report
          </button>
        }
      >
        <div className="rp-stats">
          <MiniStats
            items={[
              { value: num(t.creators_live), label: "Creators live" },
              { value: num(t.posts), label: "Posts", note: t.waiting_numbers ? `${t.waiting_numbers} waiting for numbers` : "" },
              { value: num(views.v), label: "Views", note: cov(views.n) },
              { value: num(reach.v), label: "Reach", note: cov(reach.n) },
              { value: er, label: "Engagement on followers" },
            ]}
          />
        </div>
        {t.not_connected > 0 && (
          <div className="rp-note">
            <Note tone="amber" icon="📸">
              <b>
                {t.not_connected} creator{t.not_connected > 1 ? "s haven't" : " hasn't"} connected Instagram
              </b>
              — {t.public_ready ? "their views, likes and comments are read from their public profile (fills in over a few hours)." : "connect Facebook once as Super Admin to read public profiles."} For reach, shares and saves ask them to connect Instagram in the app.
            </Note>
          </div>
        )}
        <div className="c2-tw">
          <table className="c2-t rp-t">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Post</th>
                <th>Views</th>
                <th>Reach</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Shares</th>
                <th>Saves</th>
              </tr>
            </thead>
            <tbody>
              <TableState cols={8} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !posts.length && "No posts yet — creators show up here as soon as their reel goes live."} />
              {posts.map(({ p, nm, key }) => {
                const s = p.stats || {},
                  k = KIND[String(p.media_type || "").toUpperCase()] || "Post";
                return (
                  <tr key={key}>
                    <td>
                      <b>{nm}</b>
                    </td>
                    <td>
                      {p.permalink ? (
                        <a className="c2-link" href={p.permalink} target="_blank" rel="noreferrer">
                          {k} ↗
                        </a>
                      ) : (
                        k
                      )}
                    </td>
                    <td>{num(s.views)}</td>
                    <td>{num(s.reach)}</td>
                    <td>{num(s.likes)}</td>
                    <td>{num(s.comments)}</td>
                    <td>{num(s.shares)}</td>
                    <td>{num(s.saves)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}

      <style>{`
        .rp-stats { margin-top: -8px; }
        .rp-note { margin-top: 16px; }
        .rp-t { margin-top: 23px; }
        .rp-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
      `}</style>
    </AdminShell>
  );
}
