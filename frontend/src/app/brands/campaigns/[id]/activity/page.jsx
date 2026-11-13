"use client";

import { useEffect, useState } from "react";
import { ToneIcon } from "@/components/brands/BrandShell";
import CampaignFrame from "@/components/brands/CampaignFrame";
import { useToast } from "@/components/brands/BrandStates";
import { useTeam, TEAM_ROLES, bInitials, bAv, bAgo } from "@/services/brand";
import { ChevronDown, WhatsApp } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "posts", label: "Posts" },
  { key: "approvals", label: "Approvals" },
  { key: "money", label: "Money" },
];
// participation stage (timeline "to") → filter + icon + rang
const POSTS = ["content_approved", "published", "completed"];
const LOOK = {
  published: ["play", "green"],
  completed: ["check", "green"],
  content_approved: ["check", "green"],
  content_submitted: ["play", "orange"],
  changes_requested: ["chat", "blue"],
  content_created: ["play", "blue"],
  product_sent: ["package", "blue"],
  applied: ["users", "orange"],
  eligible: ["users", "orange"],
  sent_to_brand: ["users", "orange"],
};

/** /brands/campaigns/[id]/activity — campaign mein jo hua, naya sabse upar (purana paintTab "activity": api.brand_campaign timeline) */
export default function CampaignActivity() {
  return (
    <>
      <CampaignFrame tab="Activity">{(d) => <ActivityTab timeline={d.timeline || []} />}</CampaignFrame>

      <style>{`
        .cv { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
        .cv-card { padding: 22px; }
        .cv-list { list-style: none; margin: 0; padding: 0; position: relative; }
        .cv-list::before { content: ""; position: absolute; left: 14px; top: 16px; bottom: 16px; width: 2px; background: #eceef5; }
        .cv-list li { position: relative; display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; }
        .cv-list li .br-tone { position: relative; z-index: 1; border-radius: 50%; box-shadow: 0 0 0 4px #fff; }
        .cv-txt { flex: 1; min-width: 0; }
        .cv-txt strong { display: block; font-size: 13.5px; font-weight: 700; }
        .cv-txt small { display: block; margin-top: 2px; font-size: 12.5px; color: var(--br-muted); }
        .cv-time { font-size: 11.5px; color: var(--br-faint); white-space: nowrap; padding-top: 2px; }
        .cv-empty { color: var(--br-muted); font-size: 13px; padding-left: 40px !important; }

        .cv-team { padding: 20px; }
        .cv-team h3 { margin: 0 0 12px; font-size: 14.5px; font-weight: 800; }
        .cv-team ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
        .cv-team li, .cv-am { display: flex; align-items: center; gap: 10px; }
        .cv-team strong { display: block; font-size: 13px; font-weight: 700; }
        .cv-team small { display: block; font-size: 11.5px; color: var(--br-muted); }
        .cv-am small { color: var(--br-green); }
        .cv-team__label { margin: 16px 0 10px; padding-top: 14px; border-top: 1px solid var(--br-border); font-size: 11.5px; font-weight: 600; color: var(--br-muted); }
        .cv-wa { margin-top: 14px; }

        @media (max-width: 1023px) { .cv { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .cv-card { padding: 18px; }
          .cv-card .br-card__head { flex-wrap: wrap; }
          .cv-list li { flex-wrap: wrap; }
          .cv-time { width: 100%; padding-left: 44px; }
        }
      `}</style>
    </>
  );
}

function ActivityTab({ timeline }) {
  const team = useTeam();
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(6);
  const [now, setNow] = useState(0);
  const [toast, say] = useToast();
  useEffect(() => setNow(Date.now()), []);

  const items = timeline.map((e) => ({ ...e, kind: POSTS.includes(e.to) ? "posts" : "approvals" }));
  const list = items.filter((a) => filter === "all" || a.kind === filter);
  const members = ((team.data || {}).members || []).filter((m) => m.role !== "removed");

  return (
    <div className="cv">
      <section className="br-card cv-card">
        <div className="br-card__head">
          <div>
            <h2 className="br-card__title">Activity</h2>
            <p className="br-card__sub">Everything that happened in this campaign, newest first</p>
          </div>
          <div className="br-seg">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={filter === f.key ? "is-on" : ""}
                onClick={() => {
                  setFilter(f.key);
                  setShown(6);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ol className="cv-list">
          {list.slice(0, shown).map((a, i) => {
            const [icon, tone] = LOOK[a.to] || ["users", "violet"];
            return (
              <li key={(a.at || "") + i}>
                <ToneIcon icon={icon} tone={tone} size={30} />
                <div className="cv-txt">
                  <strong>{a.creator || "A creator"}</strong>
                  <small>{a.status || a.to}</small>
                </div>
                <span className="cv-time">{bAgo(a.at, now)}</span>
              </li>
            );
          })}
          {list.length === 0 && <li className="cv-empty">{filter === "money" ? "Bills and payments are in Billing." : "Nothing here yet."}</li>}
        </ol>

        {list.length > shown && (
          <div className="br-more">
            <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 6)}>
              Load more <ChevronDown size={14} />
            </button>
          </div>
        )}
      </section>

      <aside className="br-card cv-team">
        <h3>Your team here</h3>
        <ul>
          {members.map((t) => (
            <li key={t.member_id || t.email}>
              <span className="br-av br-av--sm" style={{ background: bAv(t.email || t.name) }}>
                {bInitials(t.name || t.email)}
              </span>
              <span>
                <strong>{t.name || t.email}</strong>
                <small>{TEAM_ROLES[t.role] || t.role}</small>
              </span>
            </li>
          ))}
          {!members.length && <li className="cv-empty">{team.loading ? "Loading…" : team.error || "Just you for now."}</li>}
        </ul>
        <p className="cv-team__label">Geek account manager</p>
        <div className="cv-am">
          <span className="br-av br-av--sm" style={{ background: "linear-gradient(135deg,#8b5cf6,#c084fc)" }}>
            G
          </span>
          <span>
            <strong>Geek team</strong>
            <small>Replies on WhatsApp and email</small>
          </span>
        </div>
        <button type="button" className="br-btn br-btn--wa br-btn--sm br-btn--block cv-wa" onClick={() => say("Coming soon — WhatsApp from here. Message your Geek account manager directly for now.")}>
          <WhatsApp size={14} /> Message on WhatsApp
        </button>
      </aside>
      {toast}
    </div>
  );
}
