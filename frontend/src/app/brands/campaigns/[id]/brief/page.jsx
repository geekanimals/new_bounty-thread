"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import CampaignTop from "@/components/brands/CampaignTop";
import { getCampaign, BRIEF } from "@/components/brands/data";
import { Download, FileText, ImageIcon, LinkIcon, Check, Close, Calendar } from "@/components/ui/Icons";

const FILE_ICON = { file: FileText, image: ImageIcon, link: LinkIcon };

/** /brands/campaigns/[id]/brief — creators ko diya gaya brief, files aur dates */
export default function CampaignBrief() {
  const { id } = useParams();
  const c = getCampaign(id);
  const [toast, setToast] = useState("");
  if (!c) notFound();

  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <BrandShell crumbs={[{ label: "Campaigns", href: "/brands/campaigns" }, { label: c.title }]}>
      <title>{`${c.title} · Brief — Geek OS Brand`}</title>
      <CampaignTop c={c} />

      <div className="cb">
        <section className="br-card cb-brief">
          <div className="cb-head">
            <div>
              <h2>Creator brief</h2>
              <p>{BRIEF.edited.replace("24", String(c.creators))}</p>
            </div>
            <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => flash("Brief PDF is downloading…")}>
              <Download size={13} /> Download
            </button>
          </div>

          <p className="cb-label">Goal</p>
          <p className="cb-goal">{BRIEF.goal}</p>

          <p className="cb-label">Key messages</p>
          <ul className="cb-msgs">
            {BRIEF.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>

          <div className="cb-dd">
            <div className="cb-do">
              <p>
                <Check size={13} /> Do
              </p>
              <ul>
                {BRIEF.dos.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="cb-dont">
              <p>
                <Close size={13} /> Don’t
              </p>
              <ul>
                {BRIEF.donts.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="cb-label">Deliverables</p>
          <div className="cb-tags">
            {BRIEF.deliverables.map((d) => (
              <span key={d} className="br-badge br-badge--violet">
                {d}
              </span>
            ))}
          </div>

          <p className="cb-label">Hashtags &amp; tags</p>
          <p className="cb-hash">
            {BRIEF.hashtags} <span>·</span> {BRIEF.tag}
          </p>
        </section>

        <aside className="cb-side">
          <section className="br-card cb-box">
            <h3>Files</h3>
            <ul className="cb-files">
              {BRIEF.files.map((f) => {
                const Icon = FILE_ICON[f.kind];
                return (
                  <li key={f.name}>
                    <button type="button" onClick={() => flash(`${f.name} is downloading…`)}>
                      <span className="cb-files__ic">
                        <Icon size={14} />
                      </span>
                      <span className="cb-files__txt">
                        <strong>{f.name}</strong>
                        <small>{f.meta}</small>
                      </span>
                      <Download size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="br-card cb-box">
            <h3>
              <Calendar size={14} /> Key dates
            </h3>
            <dl className="cb-dates">
              {BRIEF.dates.map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>

      {toast && (
        <div className="br-toast" role="status">
          <Check size={14} /> {toast}
        </div>
      )}

      <style>{`
        .cb { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 18px; align-items: start; }
        .cb-brief { padding: 24px; }
        .cb-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--br-border); }
        .cb-head h2 { margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.01em; }
        .cb-head p { margin: 3px 0 0; font-size: 12.5px; color: var(--br-muted); }
        .cb-label { margin: 20px 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .cb-goal { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.55; }
        .cb-msgs { margin: 0; padding-left: 18px; display: grid; gap: 6px; font-size: 13.5px; }
        .cb-msgs li::marker { color: var(--br-primary); }
        .cb-dd { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
        .cb-do, .cb-dont { padding: 14px 16px; border-radius: 13px; }
        .cb-do { background: var(--br-green-bg); }
        .cb-dont { background: var(--br-red-bg); }
        .cb-dd p { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 13px; font-weight: 800; }
        .cb-do p { color: var(--br-green); }
        .cb-dont p { color: var(--br-red); }
        .cb-dd ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; font-size: 12.5px; color: var(--br-text); }
        .cb-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .cb-tags .br-badge { height: 26px; font-size: 12px; }
        .cb-hash { margin: 0; font-size: 13.5px; font-weight: 700; color: var(--br-primary); word-break: break-word; }
        .cb-hash span { color: var(--br-faint); margin: 0 4px; }

        .cb-side { display: grid; gap: 16px; }
        .cb-box { padding: 20px; }
        .cb-box h3 { display: flex; align-items: center; gap: 7px; margin: 0 0 12px; font-size: 14.5px; font-weight: 800; }
        .cb-files { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
        .cb-files button {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 11px 12px;
          border: 0; border-radius: 12px; background: #f4f5fa; text-align: left; color: var(--br-faint);
        }
        .cb-files button:hover { background: var(--br-lilac); color: var(--br-primary); }
        .cb-files__ic { width: 30px; height: 30px; border-radius: 9px; background: #fff; color: var(--br-primary); display: grid; place-items: center; flex-shrink: 0; }
        .cb-files__txt { flex: 1; min-width: 0; color: var(--br-ink); }
        .cb-files__txt strong { display: block; font-size: 13px; font-weight: 700; }
        .cb-files__txt small { display: block; font-size: 11.5px; color: var(--br-muted); }
        .cb-dates { margin: 0; display: grid; gap: 10px; }
        .cb-dates div { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
        .cb-dates dt { color: var(--br-muted); }
        .cb-dates dd { margin: 0; font-weight: 800; }

        @media (max-width: 1023px) {
          .cb { grid-template-columns: 1fr; }
          .cb-side { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .cb-brief { padding: 18px; }
          .cb-dd, .cb-side { grid-template-columns: 1fr; }
        }
      `}</style>
    </BrandShell>
  );
}
