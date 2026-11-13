"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, SubTabs, BoxState, useToast, copyText } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText } from "@/lib/supabase";

/*
 * ✉️ Outreach message — purane app ka bpOutreachHtml.
 * Data: api.get_outreach (saved fields + campaign / brand) · Save: api.save_outreach(p_campaign, p_payload)
 * "Send to matching creators" → purane jaisa invite panel = /find (matching creators).
 */
const FIELDS = [
  ["brand_usp", "About the brand (USP)", "India's favourite momos, 400+ outlets"],
  ["eligibility", "Who’s eligible", "Food creators in Delhi NCR, 10k+ followers"],
  ["what_you_get", "What you get", "Momo box worth ₹1,500 + a feature on our page"],
  ["deliverables", "Deliverables", "1 Reel + 2 Stories within 7 days of delivery"],
  ["sample_link", "Sample video link", "https://instagram.com/reel/…"],
  ["form_link", "Form link", "https://… (or leave blank to use the app)"],
  ["extra_note", "Anything else", "Shoot window, city, do's and don'ts"],
];

export default function CampaignOutreach() {
  const { id } = useParams();
  const router = useRouter();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.get_outreach", { p_campaign: id }, { skip: !id || id === "sample" });
  const [f, setF] = useState({});
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  useEffect(() => {
    if (data) setF(Object.fromEntries(FIELDS.map(([k]) => [k, data[k] || ""])));
  }, [data]);

  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  // purane bpMessageText jaisa — ek ready message
  const link = (f.form_link || "").trim() || `${origin}/creater`;
  const lines = [
    `🎁 ${data?.brand || "Brand"} × ${data?.campaign || "Barter campaign"}`,
    f.brand_usp?.trim() && `About: ${f.brand_usp.trim()}`,
    f.eligibility?.trim() && `Who we're looking for: ${f.eligibility.trim()}`,
    f.what_you_get?.trim() && `What you get: ${f.what_you_get.trim()}`,
    f.deliverables?.trim() && `What you make: ${f.deliverables.trim()}`,
    f.sample_link?.trim() && `Sample video: ${f.sample_link.trim()}`,
    f.extra_note?.trim(),
    `Apply here: ${link}`,
  ].filter(Boolean);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = Object.fromEntries(FIELDS.map(([k]) => [k, f[k] || ""]));
    const { error: er } = await rpc("admin", "api.save_outreach", { p_campaign: id, p_payload: payload });
    setBusy(false);
    show(er ? errText(er) : "Saved ✓");
    if (!er) reload(true);
  };

  const copy = async () => {
    await copyText(lines.join("\n\n"));
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
          {!data && (loading || error) ? (
            <BoxState loading={loading} error={error} onRetry={reload} />
          ) : (
            <form className="or-form" onSubmit={save}>
              {FIELDS.map(([k, l, ph]) => (
                <label key={k} className="or-field">
                  <span>{l}</span>
                  <input className="ad-input" value={f[k] || ""} onChange={set(k)} placeholder={ph} />
                </label>
              ))}
              <div className="or-act">
                <button type="submit" className="ad-btn ad-btn--primary" disabled={busy}>
                  {busy ? "Saving…" : "Save message"}
                </button>
                <button type="button" className="ad-btn ad-btn--ghost" onClick={copy}>
                  📋 Copy for story / groups
                </button>
                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => router.push(`/admin/campaigns/${id}/find`)}>
                  📣 Send to matching creators
                </button>
              </div>
            </form>
          )}
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
        .or-bubble p + p { margin-top: 8px; }
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
