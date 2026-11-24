"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, MiniStats, Note, TableState, useToast, downloadFile, num } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";
import { useAsk, readInsightsShot, uploadInsightsProof } from "@/components/admin/campaign/journey";
import Link from "next/link";
import { useProofNeeds } from "@/components/admin/campaign2/ContentTabs";

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
  const [q, setQ] = useState("");
  const [askEl, ask] = useAsk();
  // purana "📷 Add insights / Update" — Instagram se numbers na aaye to haath se (bp_record_metrics)
  const addNums = async (r, p) => {
    const NUMS = [["views", "Views / plays"], ["reach", "Reach"], ["likes", "Likes"], ["comments", "Comments"], ["shares", "Shares"], ["saves", "Saves"]];
    const st = p.stats || {};
    const v = await ask({
      title: `Numbers for ${(r.creator || {}).name || "this creator"}’s ${String(p.media_type || "post").toLowerCase()}`,
      text: "Copy them from the creator's Instagram insights (they can send you a screenshot). Leave a box empty if you don't have it. 12.4k works.",
      ok: "Save numbers",
      fields: [
        { k: "shot", label: "📷 Insights screenshot (optional) — we read the numbers off it", file: true, onFile: (f, setV) => readInsightsShot(f, p.media_type, setV) },
        // jo numbers pehle se hain (Instagram / public profile / typed) wahi bhare rahein — save par koi number na mite
        ...NUMS.map(([k, l]) => ({ k, label: l, value: st[k] == null ? "" : String(st[k]) })),
      ],
    });
    if (!v) return;
    const pl = {};
    NUMS.forEach(([k]) => {
      const m = String(v[k] || "").replace(/[,\s]/g, "").toLowerCase().match(/^([0-9]+(?:\.[0-9]+)?)(k|m|l)?$/);
      if (m) pl[k] = Math.round(Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : m[2] === "l" ? 1e5 : 1));
    });
    if (!Object.keys(pl).length) return show("Add at least one number.");
    if (p.post_id) pl.post_id = p.post_id;
    if (v.shot && typeof v.shot === "object") {
      try {
        pl.screenshot_url = await uploadInsightsProof(v.shot);
      } catch (e) {
        return show(e.message || String(e));
      }
    }
    // Geek OS creator → bp_record_metrics · sheet creator (abhi Geek OS par nahi) → invite_add_post (wahi post update hoti hai)
    const { error: e } = r.participation_id
      ? await rpc("admin", "api.bp_record_metrics", { p_participation: r.participation_id, p_payload: pl })
      : await rpc("admin", "api.invite_add_post", {
          p_invite: r.invite_id,
          p_payload: { permalink: p.permalink || null, media_type: String(p.media_type || "reel").toLowerCase().includes("stor") ? "story" : String(p.media_type || "").toLowerCase().includes("post") || String(p.media_type || "").toUpperCase() === "IMAGE" ? "post" : "reel", metrics: Object.fromEntries(Object.entries(pl).filter(([k]) => k !== "post_id" && k !== "screenshot_url")), screenshot_url: pl.screenshot_url || null },
        });
    if (e) return show(errText(e));
    show("Numbers saved ✓");
    reload();
  };
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_analytics", { p_campaign: id }, { skip: !id || id === "sample" });
  const a = data || {};
  const proofs = useProofNeeds(id);
  const storyNeed = proofs.story;
  const storyRows = (proofs.board && proofs.board.rows) || [];
  const shotsOf = (r) => {
    const x = storyRows.find((b) => (r.participation_id && b.participation_id === r.participation_id) || (r.invite_id && b.invite_id === r.invite_id));
    return x ? (x.stories || []).filter((s) => s.url || s.old) : [];
  };
  const storyDone = storyRows.filter((b) => (b.stories || []).filter((s) => s.url || s.old).length >= storyNeed).length;
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
    return (r.posts || []).map((p, i) => ({ p, r, nm, key: `${r.participation_id || r.invite_id}-${i}` }));
  });
  const qq = q.trim().toLowerCase();
  const shownPosts = qq ? posts.filter(({ r, nm }) => `${nm} ${handleOf(r)} ${(r.creator || {}).city || ""}`.toLowerCase().includes(qq)) : posts;

  const download = () => {
    const c = a.campaign || {};
    const head = ["Instagram", "Name", "Profile link", "On Geek OS", "Followers", "Post type", "Post link", "Posted on", "Views", "Reach", "Likes", "Comments", "Shares", "Saves", "Numbers from", "Status", ...(storyNeed ? ["Story screenshots"] : [])];
    const lines = [];
    rows.forEach((r) => {
      const cr = r.creator || {},
        h = handleOf(r);
      (r.posts || []).forEach((p) => {
        const s = p.stats || {};
        lines.push([h ? "@" + h : "", cr.name || "", h ? `https://instagram.com/${h}` : "", r.on_sheet || r.not_connected || cr.followers == null ? "Not yet" : "Yes", cr.followers ?? "", p.media_type, p.permalink || "", p.posted_at ? new Date(p.posted_at).toLocaleDateString("en-IN") : "", s.views ?? "", s.reach ?? "", s.likes ?? "", s.comments ?? "", s.shares ?? "", s.saves ?? "", s.source === "public" ? "public profile" : s.source === "screenshot" ? "screenshot" : s.source === "manual" ? "typed in" : "Instagram insights", r.stage, ...(storyNeed ? [shotsOf(r).map((x) => x.url || x.link).join(" ")] : [])]);
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
        {storyNeed > 0 && (
          <div className="rp-note">
            <Note tone={storyDone >= storyRows.length && storyRows.length ? "green" : "amber"} icon="📸">
              <b>
                Stories: {storyDone} of {storyRows.length} creators have their story screenshot{storyNeed > 1 ? `s (${storyNeed} each)` : ""}
              </b>{" "}
              — a story&apos;s proof is its screenshot.{" "}
              <Link href={`/vault/campaigns/${id}/stories`}>
                <u>Open story screenshots</u>
              </Link>{" "}
              to see, download or add them (one by one or in bulk).
            </Note>
          </div>
        )}
        <input className="ga-input rp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Filter these rows — name, @handle, city" aria-label="Filter report rows" />
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
                <th aria-label="Numbers" />
              </tr>
            </thead>
            <tbody>
              <TableState cols={9} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !posts.length && "No posts yet — creators show up here as soon as their reel goes live."} />
              {shownPosts.map(({ p, r, nm, key }) => {
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
                    <td>
                      {r.participation_id || (r.invite_id && p.permalink) ? (
                        <button type="button" className="rp-ins" onClick={() => addNums(r, p)} title="Add or correct the numbers from the creator's insights screenshot">
                          {s.source === "screenshot" || s.source === "manual" ? "✏️ Update" : s.views != null || s.likes != null || s.reach != null ? "✏️ Edit numbers" : "📷 Add insights"}
                        </button>
                      ) : (
                        <span className="rp-mute" title="No post link yet">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      {toast}
      {askEl}

      <style>{`
        .rp-stats { margin-top: -8px; }
        .rp-note { margin-top: 16px; }
        .rp-t { margin-top: 12px; }
        .rp-q { margin-top: 18px; width: min(340px, 100%); height: 42px; }
        .rp-ins { border: 1px solid var(--ad-line-2); border-radius: 9px; background: #fff; padding: 6px 10px; font-size: 12px; font-weight: 800; color: #6657e9; white-space: nowrap; cursor: pointer; }
        .rp-ins:hover { border-color: var(--ad-primary); }
        .rp-mute { color: var(--ad-muted); }
        .rp-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
      `}</style>
    </AdminShell>
  );
}
