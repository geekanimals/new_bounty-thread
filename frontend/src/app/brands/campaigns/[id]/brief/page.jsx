"use client";

import CampaignFrame from "@/components/brands/CampaignFrame";
import { useToast } from "@/components/brands/BrandStates";
import { bLines, bDate, B_TYPE } from "@/services/brand";
import { Download, Check, Close, Calendar, Info } from "@/components/ui/Icons";

/** /brands/campaigns/[id]/brief — creators ko diya gaya brief (purana paintBrief: api.brand_campaign campaign + video_brief) */
export default function CampaignBrief() {
  return (
    <>
      <CampaignFrame tab="Brief">{(d) => <BriefTab c={d.campaign || {}} n={(d.creators || []).length} />}</CampaignFrame>

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
              .cb-none { margin: 0; font-size: 13px; color: var(--br-muted); }
        .cb-note { display: flex; align-items: center; gap: 7px; margin: 20px 0 0; padding-top: 14px; border-top: 1px solid var(--br-border); font-size: 12.5px; color: var(--br-muted); }
        .cb-goal { white-space: pre-wrap; }
`}</style>
    </>
  );
}

const tags = (v) => (Array.isArray(v) ? v : String(v || "").split(/[\s,]+/)).map((x) => String(x).trim()).filter(Boolean);

function BriefTab({ c, n }) {
  const [toast, say] = useToast();
  const vb = c.video_brief || {};
  const goal = c.brief || vb.what_to_shoot || c.objective || "";
  const msgs = bLines(vb.key_messages);
  const dos = bLines(vb.dos);
  const donts = bLines(vb.donts);
  const deliver = bLines(c.deliverables_text);
  const hash = tags(c.hashtags).map((h) => (h.startsWith("#") ? h : `#${h}`));
  const ment = tags(c.mentions).map((m) => (m.startsWith("@") ? m : `@${m}`));
  const cities = Array.isArray(c.cities) ? c.cities.join(", ") : c.cities || "";
  const dates = [
    { label: "Starts", value: bDate(c.starts_on) },
    { label: "Ends", value: bDate(c.ends_on) },
    c.creators_needed ? { label: "Creators needed", value: String(c.creators_needed) } : null,
    c.platforms ? { label: "Platforms", value: c.platforms } : null,
    cities ? { label: "Cities", value: cities } : null,
    c.campaign_type ? { label: "Type", value: B_TYPE[c.campaign_type] || c.campaign_type } : null,
  ].filter(Boolean);

  return (
    <div className="cb">
      <section className="br-card cb-brief">
        <div className="cb-head">
          <div>
            <h2>Creator brief</h2>
            <p>
              Shared with {n} creator{n === 1 ? "" : "s"}
              {c.product ? ` · ${c.product}` : ""}
            </p>
          </div>
          <button type="button" className="br-btn br-btn--ghost br-btn--sm" onClick={() => say("Coming soon — brief PDF. Use PDF report in the header for results.")}>
            <Download size={13} /> Download
          </button>
        </div>

        <p className="cb-label">Goal</p>
        <p className="cb-goal">{goal || "The Geek team is writing the brief."}</p>

        {msgs.length > 0 && (
          <>
            <p className="cb-label">Key messages</p>
            <ul className="cb-msgs">
              {msgs.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )}

        {(dos.length > 0 || donts.length > 0) && (
          <div className="cb-dd">
            <div className="cb-do">
              <p>
                <Check size={13} /> Do
              </p>
              <ul>
                {(dos.length ? dos : ["—"]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="cb-dont">
              <p>
                <Close size={13} /> Don’t
              </p>
              <ul>
                {(donts.length ? donts : ["—"]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="cb-label">Deliverables</p>
        <div className="cb-tags">
          {deliver.length ? (
            deliver.map((x) => (
              <span key={x} className="br-badge br-badge--violet">
                {x}
              </span>
            ))
          ) : (
            <span className="cb-none">Not set yet</span>
          )}
        </div>

        {(hash.length > 0 || ment.length > 0) && (
          <>
            <p className="cb-label">Hashtags &amp; tags</p>
            <p className="cb-hash">
              {hash.join("  ")}
              {hash.length > 0 && ment.length > 0 && <span> · </span>}
              {ment.length > 0 && `tag ${ment.join(" ")}`}
            </p>
          </>
        )}

        {vb.caption && (
          <>
            <p className="cb-label">Caption</p>
            <p className="cb-goal">{vb.caption}</p>
          </>
        )}

        <p className="cb-note">
          <Info size={13} /> Want to change the brief? Message the Geek team.
        </p>
      </section>

      <aside className="cb-side">
        <section className="br-card cb-box">
          <h3>Files</h3>
          <p className="cb-none">Reference files are shared with creators by the Geek team.</p>
        </section>
        <section className="br-card cb-box">
          <h3>
            <Calendar size={14} /> Key dates
          </h3>
          <dl className="cb-dates">
            {dates.map((x) => (
              <div key={x.label}>
                <dt>{x.label}</dt>
                <dd>{x.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </aside>
      {toast}
    </div>
  );
}
