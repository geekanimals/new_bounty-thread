"use client";

import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";

/* Creator profile → Profile tab (Figma: missing banner + Personal / Contact / Professional) */
export default function CreatorProfileTab() {
  const { id } = useParams();
  return (
    <CreatorDrawer id={id} tab="profile">
      {(p) => (
        <div className="cpp">
          {p.missing && <p className="cpp-miss">Still missing: {p.missing}</p>}
          {[
            ["Personal", p.personal],
            ["Contact", p.contact],
            ["Professional", p.professional],
          ].map(([h, rows]) => (
            <section key={h} className="cpp-sec">
              <h3>{h}</h3>
              <div className="cpp-grid">
                {rows.map(([k, v]) => (
                  <div key={k} className="cpp-f">
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <style>{`
            .cpp-miss { padding: 11px 15px; border-radius: 12px; background: #fff7e8; border: 1px solid #f5dfb5; font-size: 12px; color: #986016; }
            .cpp-sec { margin-top: 17px; }
            .cpp-sec h3 { font-size: 13px; font-weight: 700; color: var(--ad-ink); }
            .cpp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 13px; }
            .cpp-f { min-height: 79px; padding: 20px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpp-f span { display: block; font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
            .cpp-f strong { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
            @media (max-width: 640px) { .cpp-grid { grid-template-columns: 1fr; gap: 8px; } .cpp-f { min-height: 0; padding: 14px 16px; } }
          `}</style>
        </div>
      )}
    </CreatorDrawer>
  );
}
