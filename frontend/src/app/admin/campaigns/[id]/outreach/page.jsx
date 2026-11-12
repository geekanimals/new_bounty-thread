"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";
import { Panel, SubTabs, useToast, copyText } from "@/components/admin/campaign2/kit";

const FIELDS = [
  ["usp", "About the brand (USP)"],
  ["who", "Who’s eligible"],
  ["get", "What you get"],
  ["del", "Deliverables"],
  ["video", "Sample video link"],
  ["form", "Form link"],
  ["else", "Anything else"],
];

export default function CampaignOutreach() {
  const { id } = useParams();
  const c = campaignById(id);
  const base = c.name.split(" · ")[0];
  const [toast, show] = useToast();
  const [f, setF] = useState({});
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  // Preview: khaali field ho to sample text
  const get = f.get?.trim() || `the ${base.replace(/^Beardo /, "")} (₹1,099)`;
  const del = f.del?.trim() || "1 Reel + 1 Story";
  const who = f.who?.trim() || "10k+ travel & lifestyle creators in Mysore / Bengaluru";
  const link = f.form?.trim() || `bountythreads…/c/${c.id}`;
  const lines = [`🎁 ${c.brand} × ${base}`, f.usp?.trim(), `Get ${get} for ${del}.`, `Who: ${who.replace(/\.$/, "")}.`, f.video?.trim() && `Sample: ${f.video.trim()}`, f.else?.trim(), `Apply here: ${link}`].filter(Boolean);

  const copy = async () => {
    await copyText(lines.join("\n"));
    show("Message copied — paste it in your story or WhatsApp groups");
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <SubTabs
        active="outreach"
        items={[
          { k: "messages", label: "💬 Messages & templates", href: `/admin/campaigns/${id}/messages` },
          { k: "outreach", label: "✉️ Outreach message", href: `/admin/campaigns/${id}/outreach` },
        ]}
      />

      <div className="or-grid">
        <Panel title="✉️ Outreach message" sub="What goes to your creator database, your story and WhatsApp groups — everything is filled into one ready message.">
          <form
            className="or-form"
            onSubmit={(e) => {
              e.preventDefault();
              show("Outreach message saved");
            }}
          >
            {FIELDS.map(([k, l]) => (
              <label key={k} className="or-field">
                <span>{l}</span>
                <input className="ad-input" value={f[k] || ""} onChange={set(k)} placeholder={l} />
              </label>
            ))}
            <div className="or-act">
              <button type="submit" className="ad-btn ad-btn--primary">
                Save message
              </button>
              <button type="button" className="ad-btn ad-btn--ghost" onClick={copy}>
                📋 Copy for story / groups
              </button>
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => show("Sent to 42 matching creators on WhatsApp + email")}>
                📣 Send to matching creators
              </button>
            </div>
          </form>
        </Panel>

        <Panel title="Preview" className="or-prev">
          <div className="or-bubble">
            {lines.map((l, i) => (
              <p key={i}>{i === 0 ? <b>{l}</b> : l}</p>
            ))}
          </div>
        </Panel>
      </div>
      {toast}

      <style>{`
        .or-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .or-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 16px; margin-top: -2px; }
        .or-field span { display: block; margin-bottom: 9px; font-size: 12px; font-weight: 800; color: #60708c; }
        .or-field .ad-input { height: 42px; font-size: 12px; font-weight: 800; }
        .or-field .ad-input::placeholder { color: #757575; }
        .or-act { grid-column: 1 / -1; display: flex; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
        .or-act .ad-btn { height: 41px; }
        .or-prev .c2-panel__head { margin-bottom: 18px; }
        .or-prev { padding-bottom: 22px; }
        .or-bubble { padding: 13px 14px; border-radius: 12px; background: #d9fdd3; font-size: 13px; line-height: 1.5; color: var(--ad-ink); overflow-wrap: anywhere; }
        .or-bubble b { font-weight: 700; }
        @media (max-width: 1023px) { .or-grid { grid-template-columns: 1fr; } .or-prev { order: -1; } }
        @media (max-width: 640px) {
          .or-form { grid-template-columns: 1fr; }
          .or-act .ad-btn { flex: 1 1 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
