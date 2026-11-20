"use client";

/**
 * Creator ko brief organised dikhao: upar Central brief, phir har deliverable (Reel / Story / Post …) ka apna card.
 * Data: video_brief.what_to_shoot (central) + video_brief.deliverable_briefs { reel: { central, text }, … }
 * fill(text) — {code} jaise placeholders bharne ke liye (optional).
 */
const KINDS = [
  { key: "reel", label: "Reel", icon: "🎬", re: /(\d+)\s*reels?/i },
  { key: "story", label: "Story", icon: "⭕", re: /(\d+)\s*stor(?:y|ies)/i },
  { key: "post", label: "Feed post", icon: "🖼", re: /(\d+)\s*(?:feed\s*)?posts?/i },
  { key: "carousel", label: "Carousel", icon: "🗂", re: /(\d+)\s*carousels?/i },
  { key: "google_review", label: "Google review", icon: "⭐", re: /(\d+)\s*google\s*reviews?/i },
  { key: "district_review", label: "District review", icon: "🎟️", re: /(\d+)\s*district\s*reviews?/i },
];

/** text mein links clickable */
function Txt({ t }) {
  return String(t || "")
    .split(/(https?:\/\/[^\s]+)/g)
    .map((p, i) =>
      /^https?:\/\//.test(p) ? (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="bb-lnk">
          {p.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48)}
          {p.replace(/^https?:\/\/(www\.)?/, "").length > 48 ? "…" : ""} ↗
        </a>
      ) : (
        p
      )
    );
}

export default function BriefBlocks({ brief, deliverables = "", fill = (t) => t }) {
  const b = brief && typeof brief === "object" ? brief : {};
  const central = String(fill(b.what_to_shoot) || "").trim();
  const db = b.deliverable_briefs && typeof b.deliverable_briefs === "object" ? b.deliverable_briefs : null;
  const items = db ? KINDS.filter((k) => db[k.key]) : [];
  const refs = Array.isArray(b.reference_images) ? b.reference_images.filter((x) => x && /^https?:\/\//.test(String(x.url || ""))) : [];
  if (!central && !items.length && !refs.length) return null;
  const count = (k) => {
    const m = String(deliverables || "").match(k.re);
    return m ? Number(m[1]) : 0;
  };
  return (
    <div className="bb">
      {central && (
        <section className="bb-central">
          <p className="bb-k">📋 Central brief{items.length ? <small> · applies to every piece unless its card says otherwise</small> : null}</p>
          <p className="bb-v"><Txt t={central} /></p>
        </section>
      )}
      {items.length > 0 && (
        <>
          <p className="bb-k bb-k--sec">What to make</p>
          <div className="bb-grid">
            {items.map((k) => {
              const x = db[k.key] || {};
              const own = x.central === false;
              const t = String(fill(x.text) || "").trim();
              const n = count(k);
              return (
                <article key={k.key} className={`bb-card ${own ? "is-own" : ""}`}>
                  <header>
                    <b>
                      {k.icon} {k.label}
                      {n > 1 ? <small> × {n}</small> : null}
                    </b>
                    <span className="bb-chip">{own ? "Own brief" : "Central brief"}</span>
                  </header>
                  {own ? (
                    t ? <p className="bb-v"><Txt t={t} /></p> : <p className="bb-muted">The brief for this shows here soon.</p>
                  ) : (
                    <>
                      {central && <p className="bb-muted">Follow the central brief above.</p>}
                      {t ? (
                        <p className="bb-v">
                          {central ? <b>Extra for this {k.label.toLowerCase()}: </b> : null}
                          <Txt t={t} />
                        </p>
                      ) : !central ? (
                        <p className="bb-muted">Follow the campaign brief.</p>
                      ) : null}
                    </>
                  )}
                  {Array.isArray(x.images) && x.images.some((im) => im && /^https?:\/\//.test(String(im.url || ""))) && (
                    <div className="bb-imgs">
                      <small>Reference — copy this style</small>
                      {x.images.filter((im) => im && /^https?:\/\//.test(String(im.url || ""))).map((im, j) => (
                        <a key={j} href={im.url} target="_blank" rel="noopener noreferrer" className="bb-ref">
                          <img src={im.url} alt={im.note || "Reference"} loading="lazy" />
                          {im.note && <span>{im.note}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      {refs.length > 0 && (
        <>
          <p className="bb-k bb-k--sec">Reference — copy this style</p>
          <div className="bb-refs">
            {refs.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="bb-ref">
                <img src={r.url} alt={r.note || "Reference"} loading="lazy" />
                {r.note && <span>{r.note}</span>}
              </a>
            ))}
          </div>
        </>
      )}
      <style>{`
        .bb-imgs { display: grid; gap: 6px; }
        .bb-imgs small { font-size: 11px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; color: #8a6b32; }
        .bb-lnk { color: #0b7a62; font-weight: 700; word-break: break-all; }
        .bb-central .bb-lnk { color: #e8b04a; }
        .bb-refs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); gap: 10px; }
        .bb-ref { display: grid; gap: 6px; padding: 8px; border-radius: 14px; background: #fffaf0; border: 1px solid #e8dcc0; color: inherit; text-decoration: none; }
        .bb-ref img { width: 100%; max-height: 360px; object-fit: contain; border-radius: 10px; background: #fff; }
        .bb-ref span { font-size: 12.5px; line-height: 1.45; color: #2a1e14; }
        .bb { display: grid; gap: 10px; margin: 6px 0 12px; min-width: 0; }
        .bb-k { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; color: #8a6b32; }
        .bb-k small { font-weight: 500; letter-spacing: 0; text-transform: none; color: #8f8169; }
        .bb-k--sec { margin-top: 4px; }
        .bb-central { display: grid; gap: 6px; padding: 14px 16px; border-radius: 14px; background: #123524; color: #fbf3e2; }
        .bb-central .bb-k { color: #e8b04a; }
        .bb-central .bb-k small { color: #cfc3a6; }
        .bb-central .bb-v { color: #fbf3e2; }
        .bb-v { margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-line; overflow-wrap: anywhere; color: #2a1e14; }
        .bb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: 10px; }
        .bb-card { display: grid; align-content: start; gap: 8px; min-width: 0; padding: 13px 14px; border-radius: 14px; background: #fffaf0; border: 1px solid #e8dcc0; }
        .bb-card.is-own { border-color: #e8b04a; box-shadow: 0 0 0 3px rgba(232,176,74,.18); }
        .bb-card header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .bb-card header b { font-size: 14px; color: #14231a; }
        .bb-card header small { font-weight: 600; color: #8f8169; }
        .bb-chip { padding: 3px 9px; border-radius: 999px; background: #f1e6cc; color: #6b5a3a; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .bb-card.is-own .bb-chip { background: #e8b04a; color: #14231a; }
        .bb-muted { margin: 0; font-size: 12.5px; color: #8f8169; }
        @media (max-width: 600px) {
          .bb-central { padding: 12px 13px; }
          .bb-v { font-size: 13.5px; }
          .bb-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
