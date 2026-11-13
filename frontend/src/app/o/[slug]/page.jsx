"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { rpc, safeUrl, fmtNum } from "@/lib/supabasePublic";

const initials = (s = "?") =>
  String(s)
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const waDigits = (raw) => {
  if (!raw) return "";
  let d = String(raw).replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d.slice(1);
  d = d.replace(/\D/g, "");
  return d.length === 10 ? "91" + d : d;
};

/**
 * /o/<slug> — agency / brand workspace ka public page (public_org).
 * Live app ka o.html?o=<slug> yahi hai.
 */
export default function OrgPage() {
  const { slug = "" } = useParams();
  const [st, setSt] = useState({ phase: "load" });

  useEffect(() => {
    if (!slug) return setSt({ phase: "fail" });
    rpc("public_org", { p_slug: slug })
      .then((o) => {
        if (!o) return setSt({ phase: "fail" });
        document.title = `${o.display_name} — Geek`;
        setSt({ phase: "ok", o });
      })
      .catch(() => setSt({ phase: "fail" }));
  }, [slug]);

  const o = st.o;
  const creators = Array.isArray(o?.creators) ? o.creators : [];

  return (
    <main className="og">
      <div className="og-wrap">
        <header className="og-top">
          <a href="/" className="og-logo">
            Geek
          </a>
          <a href="/creator" className="og-cta">
            Join as a creator →
          </a>
        </header>

        {st.phase === "load" && <p className="og-msg">Loading…</p>}
        {st.phase === "fail" && <p className="og-msg">This page isn’t public or doesn’t exist.</p>}

        {st.phase === "ok" && (
          <>
            <section className="og-hero">
              {o.logo_url ? <img className="og-av" src={safeUrl(o.logo_url)} alt="" /> : <div className="og-av">{initials(o.display_name)}</div>}
              <h1>{o.display_name}</h1>
              {o.tagline && <p className="og-tag">{o.tagline}</p>}
              {o.city && <p className="og-tag og-tag--sm">📍 {o.city}</p>}
              {o.bio && <p className="og-bio">{o.bio}</p>}
              <div className="og-stats">
                <div>
                  <b>{fmtNum(o.creator_count)}</b>
                  <span>Creators</span>
                </div>
                <div>
                  <b>{fmtNum(o.campaign_count)}</b>
                  <span>Campaigns</span>
                </div>
              </div>
              <div className="og-contact">
                {o.whatsapp && (
                  <a className="og-btn og-btn--wa" href={`https://wa.me/${waDigits(o.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                    💬 WhatsApp
                  </a>
                )}
                {o.email && (
                  <a className="og-btn" href={`mailto:${o.email}`}>
                    ✉ Email
                  </a>
                )}
                {o.website && (
                  <a className="og-btn" href={safeUrl(o.website)} target="_blank" rel="noopener noreferrer">
                    🔗 Website
                  </a>
                )}
              </div>
            </section>

            {creators.length > 0 && (
              <section className="og-sec">
                <h2>Creators</h2>
                <div className="og-grid">
                  {creators.map((c, i) => (
                    <div key={i} className="og-card">
                      <span className="og-cav">{initials(c.name)}</span>
                      <div>
                        <p className="og-cn">{c.name}</p>
                        <p className="og-cs">{[c.tier, c.followers, c.city].filter(Boolean).join(" · ") || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        <p className="og-foot">
          Workspace on <a href="/">Geek Influencer OS</a>
        </p>
      </div>
      <style>{`
        .og { min-height: 100vh; background: #fcfdef; color: #23251a; }
        .og-wrap { max-width: 860px; margin: 0 auto; padding: 22px 20px 56px; }
        .og-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .og-logo { font-family: var(--font-serif), Georgia, serif; font-size: 26px; font-weight: 600; color: #23251a; text-decoration: none; }
        .og-cta { height: 40px; display: inline-flex; align-items: center; padding: 0 16px; border-radius: 999px; background: #33381f; color: #fcfdef; font-size: 13px; font-weight: 600; text-decoration: none; }
        .og-msg { padding: 80px 0; text-align: center; color: #6b6d5c; }
        .og-hero { margin-top: 30px; padding: 34px 24px; border-radius: 26px; background: #fff; border: 1px solid #e6e8d3; text-align: center; }
        .og-av { width: 86px; height: 86px; margin: 0 auto; border-radius: 24px; object-fit: cover; display: grid; place-items: center; background: #5d6b2e; color: #fcfdef; font-size: 28px; font-weight: 700; }
        .og-hero h1 { margin: 16px 0 0; font-family: var(--font-serif), Georgia, serif; font-size: 40px; font-weight: 500; line-height: 1.1; }
        .og-tag { margin: 8px 0 0; font-size: 15px; color: #5d6b2e; font-weight: 600; }
        .og-tag--sm { font-size: 13px; color: #6b6d5c; font-weight: 500; }
        .og-bio { max-width: 560px; margin: 14px auto 0; font-size: 15px; line-height: 1.6; color: #4a4c3c; }
        .og-stats { display: flex; justify-content: center; gap: 12px; margin-top: 22px; }
        .og-stats div { min-width: 120px; padding: 14px 18px; border-radius: 16px; background: #f7f8e6; }
        .og-stats b { display: block; font-size: 24px; font-weight: 700; }
        .og-stats span { font-size: 12px; color: #6b6d5c; }
        .og-contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 20px; }
        .og-btn { height: 42px; display: inline-flex; align-items: center; padding: 0 16px; border-radius: 999px; border: 1px solid #d9dcc2; color: #23251a; font-size: 14px; font-weight: 600; text-decoration: none; background: #fff; }
        .og-btn--wa { background: #25d366; border-color: #25d366; color: #fff; }
        .og-sec { margin-top: 30px; }
        .og-sec h2 { margin: 0 0 14px; font-family: var(--font-serif), Georgia, serif; font-size: 28px; font-weight: 500; }
        .og-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .og-card { display: flex; align-items: center; gap: 12px; padding: 13px; border-radius: 16px; background: #fff; border: 1px solid #e6e8d3; min-width: 0; }
        .og-card > div { min-width: 0; }
        .og-cav { width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; display: grid; place-items: center; background: #5d6b2e; color: #fcfdef; font-weight: 700; font-size: 14px; }
        .og-cn { margin: 0; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .og-cs { margin: 2px 0 0; font-size: 12px; color: #6b6d5c; }
        .og-foot { margin-top: 34px; text-align: center; font-size: 13px; color: #6b6d5c; }
        .og-foot a { color: #5d6b2e; font-weight: 600; }
        @media (max-width: 640px) {
          .og-hero { padding: 26px 16px; }
          .og-hero h1 { font-size: 32px; }
          .og-stats div { min-width: 0; flex: 1; }
        }
      `}</style>
    </main>
  );
}
