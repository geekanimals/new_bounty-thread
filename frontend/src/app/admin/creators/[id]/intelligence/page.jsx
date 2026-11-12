"use client";

import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";

/* Creator profile → Intelligence tab (Figma: restricted note + Creator Intelligence Card) */
export default function CreatorIntelTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="intelligence">
      {(p) => (
        <div className="cpn">
          <p className="cpn-note">
            <span>🔒</span> Restricted view — evidence summaries only. No private contact, rates or raw messages.
          </p>
          <h3>Creator Intelligence Card</h3>
          <div className="cpn-grid">
            {p.intel.map(([k, v]) => (
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
            @media (max-width: 640px) { .cpn-grid { grid-template-columns: 1fr; gap: 8px; } .cpn-f { min-height: 0; padding: 14px 16px; } }
          `}</style>
        </div>
      )}
    </CreatorDrawer>
  );
}
