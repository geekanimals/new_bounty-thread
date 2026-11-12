"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import CampaignTop from "@/components/brands/CampaignTop";
import { getCampaign, ACTIVITY, TEAM, ACCOUNT_MANAGER } from "@/components/brands/data";
import { ChevronDown, WhatsApp } from "@/components/ui/Icons";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "posts", label: "Posts" },
  { key: "approvals", label: "Approvals" },
  { key: "money", label: "Money" },
];

/** /brands/campaigns/[id]/activity — campaign mein jo bhi hua, naya sabse upar */
export default function CampaignActivity() {
  const { id } = useParams();
  const c = getCampaign(id);
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState(6);
  if (!c) notFound();

  const list = ACTIVITY.filter((a) => filter === "all" || a.kind === filter);

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: c.title }]}>
      <title>{`${c.title} · Activity — Geek OS Brand`}</title>
      <CampaignTop c={c} />

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
            {list.slice(0, shown).map((a, i) => (
              <li key={a.title + i}>
                <ToneIcon icon={a.icon} tone={a.tone} size={30} />
                <div className="cv-txt">
                  <strong>{a.title}</strong>
                  <small>{a.text}</small>
                </div>
                <span className="cv-time">{a.time}</span>
              </li>
            ))}
            {list.length === 0 && <li className="cv-empty">Nothing here yet.</li>}
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
            {TEAM.map((t) => (
              <li key={t.email}>
                <span className="br-av br-av--sm" style={{ background: t.av }}>
                  {t.initials}
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </span>
              </li>
            ))}
          </ul>
          <p className="cv-team__label">Geek account manager</p>
          <div className="cv-am">
            <span className="br-av br-av--sm" style={{ background: ACCOUNT_MANAGER.av }}>
              {ACCOUNT_MANAGER.initials}
            </span>
            <span>
              <strong>{ACCOUNT_MANAGER.name}</strong>
              <small>{ACCOUNT_MANAGER.note}</small>
            </span>
          </div>
          <a href="https://wa.me/" target="_blank" rel="noreferrer" className="br-btn br-btn--wa br-btn--sm br-btn--block cv-wa">
            <WhatsApp size={14} /> Message on WhatsApp
          </a>
        </aside>
      </div>

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
    </BrandShell>
  );
}
