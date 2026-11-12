"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CreatorDrawer from "@/components/admin/creator/CreatorDrawer";

/* Creator profile → Media kit tab (Figma: note + "⤢ Bigger" + 4 numbers) */
export default function CreatorKitTab() {
  const { id } = useParams();
  const [big, setBig] = useState(false);
  return (
    <CreatorDrawer id={id} tab="media-kit">
      {(p) => (
        <div className={`cpk ${big ? "is-big" : ""}`}>
          <div className="cpk-top">
            <p>Everything brands see: audience (gender, age, countries, cities), top posts, work portfolio, content showcase.</p>
            <button type="button" onClick={() => setBig(!big)}>
              {big ? "⤡ Smaller" : "⤢ Bigger"}
            </button>
          </div>
          <div className="cpk-nums">
            {[
              [p.ig.followers, "Followers"],
              [p.ig.eng, "Engagement"],
              [p.kit.reach, "Avg reach"],
              [p.kit.audience, "Audience"],
            ].map(([n, l]) => (
              <div key={l}>
                <strong>{n}</strong>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className="cpk-tiles" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          {big && (
            <div className="cpk-more">
              {[
                ["Top cities", "Bengaluru 41% · Chennai 18% · Mumbai 9%"],
                ["Age", "18–24 46% · 25–34 38% · 35+ 16%"],
                ["Countries", "India 92% · UAE 3% · US 2%"],
                ["Top posts", `❤️ ${Math.max(...p.ig.likes)} · ❤️ ${p.ig.likes[3]} · ❤️ ${p.ig.likes[2]}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          )}
          <style>{`
            .cpk { margin-top: 6px; }
            .cpk + .cdw-priv { margin-top: 40px; }
            .cpk-top { display: flex; align-items: baseline; gap: 8px; }
            .cpk-top p { min-width: 0; font-size: 12px; line-height: 1.4; color: var(--ad-muted); }
            .cpk-top button { flex-shrink: 0; border: 0; background: none; padding: 0; font-size: 12px; font-weight: 800; color: #6657e9; }
            .cpk-nums { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; margin-top: 18px; }
            .cpk-nums div { display: flex; flex-direction: column; padding: 18px 16px 17px; border-radius: 14px; background: var(--ad-soft-2); }
            .cpk-nums strong { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.8px; line-height: 1.35; }
            .cpk-nums span { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
            .cpk-tiles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
            .cpk-tiles span { height: 110px; border-radius: 14px; background: #ebe7fc; }
            .is-big .cpk-tiles span { height: 180px; }
            .cpk-more { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-top: 11px; }
            .cpk-more div { padding: 16px; border-radius: 14px; border: 1px solid var(--ad-line); }
            .cpk-more span { display: block; font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
            .cpk-more strong { display: block; margin-top: 6px; font-size: 13.5px; font-weight: 700; }
            @media (max-width: 640px) {
              .cpk-top { flex-direction: column; gap: 8px; }
              .cpk-tiles span { height: 80px; }
              .cpk-nums, .cpk-more { grid-template-columns: 1fr 1fr; gap: 8px; }
              .cpk-more { grid-template-columns: 1fr; }
            }
          `}</style>
        </div>
      )}
    </CreatorDrawer>
  );
}
