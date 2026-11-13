"use client";

import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";
import { useRpc, errText } from "@/lib/supabase";

/* status → seedhi English (purane intelligence.js jaisa) */
const ST = (s) => ({ insufficient_data: "Insufficient data", not_shared: "Not shared", available: "Available", observed: "Observed", derived: "Derived" }[s] || (s ? String(s).replace(/_/g, " ") : "Insufficient data"));

/** get_creator_intelligence + get_creator_commercial_readiness → Figma ke 8 boxes */
function intelRows(d, cm) {
  d = d || {};
  cm = cm || {};
  const cs = cm.category_signals || {}, f = cm.content_formats || {}, b = cm.barter_readiness || {}, r = cm.rate_indication || {}, bh = cm.brand_history || {};
  const perf = d.performance || {}, aud = d.audience || {}, rel = d.reliability || {};
  const geo = (o) => (o ? Object.keys(o).map((k) => `${k}: ${o[k]}`).join(" · ") : "");
  return [
    ["Category fit", cs.status === "observed" ? (cs.categories || []).join(", ") || "—" : ST(cs.status)],
    ["Content formats", f.status === "observed" ? (f.formats || []).join(", ") || "—" : ST(f.status)],
    ["Barter readiness", b.status === "observed" ? [b.accepts_barter ? "Yes" : "No", b.preference, b.min_product_value != null ? `min ₹${b.min_product_value}` : ""].filter(Boolean).join(" · ") : ST(b.status)],
    ["Rate indication", r.status === "derived" ? `₹${r.indicative_min}–₹${r.indicative_max}${r.negotiable ? " (negotiable)" : ""}` : ST(r.status)],
    ["Performance", perf.status === "available" ? `${perf.reels_analysed ?? 0} reels analysed` : ST(perf.status)],
    ["Audience geography", aud.country ? [geo(aud.country), geo(aud.city)].filter(Boolean).join(" · ") : "Insufficient data"],
    ["Reliability", rel.status === "available" ? rel.explanation || "Available" : ST(rel.status)],
    ["Brand experience", bh.status === "observed" ? `${bh.confirmed_count} confirmed` : ST(bh.status)],
  ];
}

/* Creator profile → Intelligence tab (Figma: restricted note + Creator Intelligence Card) */
export default function CreatorIntelTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="intelligence">
      {(p) => <Intel p={p} />}
    </CreatorDrawer>
  );
}

function Intel({ p }) {
  const skip = !p.identity;
  const a = useRpc("admin", "api.get_creator_intelligence", { p_identity_id: p.identity }, { skip });
  const b = useRpc("admin", "api.get_creator_commercial_readiness", { p_identity_id: p.identity }, { skip });
  if (skip) return <p className="cpn-none">No intelligence yet — the creator hasn&apos;t started their profile.</p>;
  if (a.error)
    return <p className="cpn-none">{/not authoris/i.test(errText(a.error)) ? "You don't have access to this creator." : `Couldn't load the card: ${errText(a.error)}`}</p>;
  if (a.loading) return <p className="cpn-none">Loading creator card…</p>;
  const rows = intelRows(a.data, b.error ? null : b.data);
  return (
        <div className="cpn">
          <p className="cpn-note">
            <span>🔒</span> Restricted view — evidence summaries only. No private contact, rates or raw messages.
          </p>
          <h3>Creator Intelligence Card</h3>
          <div className="cpn-grid">
            {rows.map(([k, v]) => (
              <div key={k} className="cpn-f">
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
          <style>{`
            .cpn-note { display: flex; gap: 8px; padding: 11px 15px; border-radius: 12px; background: #fff7e8; border: 1px solid #f5dfb5; font-size: 12px; color: #986016; }
            .cpn h3 { margin-top: 17px; font-size: 13px; font-weight: 700; }
            .cpn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 13px; }
            .cpn-f { min-height: 79px; padding: 20px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpn-f span { display: block; font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
            .cpn + .cdw-priv { margin-top: 40px; }
            .cpn-f strong { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; }
            .cpn-none { font-size: 13px; color: var(--ad-muted); }
            @media (max-width: 640px) { .cpn-grid { grid-template-columns: 1fr; gap: 8px; } .cpn-f { min-height: 0; padding: 14px 16px; } }
          `}</style>
        </div>
  );
}
