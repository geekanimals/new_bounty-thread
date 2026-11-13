"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { useRpc, errText } from "@/lib/supabase";
import { useCampaign, fmtDate } from "@/components/admin/campaign/live";

/* Figma: Campaign workspace — Content submissions (barter_tracker: Video submitted wale + sheet invites) */
export default function WorkspaceContent() {
  const { id } = useParams();
  const c = { id };
  const { c: camp } = useCampaign(id);
  const on = !!id && id !== "sample";
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !on });
  const subs = (bt.data?.creators || []).filter((x) => x.stage === "content_submitted").map((x) => {
    const cr = x.creator || {};
    const who = cr.username ? "@" + cr.username : cr.name || "Creator";
    return { k: "p-" + x.participation_id, t: `${who} — video draft to review`, s: `${camp?.name || "Campaign"} · submitted ${fmtDate(x.submission?.submitted_at)}${x.submission?.rounds > 1 ? ` · round ${x.submission.rounds}` : ""}`, video: x.submission?.url };
  });
  const sheet = (people.data?.invites || []).filter((i) => i.status === "video_submitted").map((i) => ({ k: "i-" + i.invite_id, t: `${i.handle ? "@" + i.handle : i.name || "Creator"} — video from the sheet`, s: `${camp?.name || "Campaign"} · not on Geek OS yet`, video: i.video_url }));
  const ITEMS = [...subs, ...sheet];
  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={camp} />
      <section className="ga-card wct">
        <h2 className="ga-h2">Content submissions</h2>
        <p className="wct-sub">Review against brief, ad disclosure, rights and creator consent.</p>
        <div className="wct-list">
          {ITEMS.map((i) => (
            <div key={i.k} className="wct-row">
              <span className="wct-ic">▶️</span>
              <div className="wct-main">
                <b>{i.t}</b>
                <span>{i.s}</span>
              </div>
              {i.video && (
                <a href={i.video} target="_blank" rel="noopener noreferrer" className="wct-watch">
                  ▶ Watch
                </a>
              )}
              <Link href={`/admin/campaigns/${id}/creators/${i.k}`} className="ga-btn ga-btn--ghost wct-btn">
                Review →
              </Link>
            </div>
          ))}
          {!ITEMS.length && <p className="wct-empty">{bt.error ? errText(bt.error) : bt.loading ? "Loading submissions…" : "No videos waiting for review."}</p>}
        </div>
      </section>
      <style>{`
        .wct-watch { font-size: 13px; font-weight: 800; color: #6657e9; }
        .wct-empty { padding: 20px 4px; font-size: 13px; color: var(--ad-muted); }
        .wct { padding: 22px 22px 30px; }
        .wct-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .wct-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .wct-row { display: flex; align-items: center; gap: 14px; min-height: 68px; padding: 13px 13px; border-radius: 14px; border: 1px solid var(--ad-line); transition: border-color .15s; }
        .wct-row:hover { border-color: #cfd2ee; }
        .wct-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; }
        .wct-main { flex: 1; min-width: 0; }
        .wct-main b { display: block; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .wct-main span { display: block; margin-top: 2px; font-size: 12px; color: #8791a7; }
        .wct-btn { height: 41px; padding: 0 15px; }
        @media (max-width: 640px) {
          .wct { padding: 18px 14px; }
          .wct-row { flex-wrap: wrap; }
          .wct-btn { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
