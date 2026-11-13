import Link from "next/link";
import { TYPE_LABEL, TYPE_ICON } from "@/components/creator/data";
import { Gift, Lock, Film, Ticket } from "@/components/ui/Icons";

/**
 * Campaign card — Figma ke 2 roop:
 *  - visual (desktop Home/Discover): photo, type badge, brand, title, reward, deliverables, kaun apply kare, button
 *  - compact (mobile Discover): sirf text — title, brand, type pill, worth/till/city/Instagram, "View details" + status button
 *  - guest: desktop visual + mobile par photo-left card, "Verify WhatsApp to apply"
 *  - locked: Instagram connect nahi → "⇄ Check fit"
 *  - mobile="dark": mobile par dark photo-left card (Figma: filter / locked screens)
 */
export default function CampaignCard({ c, href, guest = false, locked = false, applied = false, mobile = "compact" }) {
  const ok = !locked && c.eligible;
  // Locked card: city chhod ke sirf followers + category (Figma)
  const whoLocked = c.who.replace(/ • Based in [^•]+/, "").replace("Category: ", "");
  // Supabase data: c.checked === false = eligibility pata nahi (purane "⇄ Check fit"), c.closed = applications band
  const unknown = !locked && !applied && c.checked === false;
  const status = applied ? "Applied" : c.closed ? "Applications closed" : unknown ? "Check fit" : ok ? "You match" : "Not eligible";
  return (
    <div className={`cc-wrap ${guest || mobile === "dark" ? "cc-wrap--row" : ""} ${guest ? "cc-wrap--guest" : mobile === "dark" ? "cc-wrap--dark" : ""}`}>
      {/* ---------- Visual card ---------- */}
      <article className="cc">
        <Link href={href} className="cc-img" aria-label={c.title}>
          <img src={c.img} alt="" loading="lazy" />
          <span className="cc-type">{TYPE_LABEL[c.type]}</span>
        </Link>
        <div className="cc-body">
          <p className="cc-brand">{c.brand}</p>
          <h3 className="cc-title">
            <Link href={href}>{c.title}</Link>
          </h3>
          <p className="cc-reward">
            <Gift size={14} /> {c.reward}
          </p>
          <p className="cc-line">
            <Film size={11} />{c.deliver}
          </p>
          <p className="cc-line cc-line--who">
            <Ticket size={11} />{guest ? c.who : locked ? whoLocked : c.short}
          </p>
          <div className="cc-foot">
            {guest ? (
              <Link href={href} className="cc-btn">
                <Lock size={12} /> Verify WhatsApp to apply
              </Link>
            ) : (
              <>
                {locked || unknown ? (
                  <span className="cc-fit">⇄ Check fit</span>
                ) : c.closed && !applied ? (
                  <span className="cc-no">🔒 Applications closed</span>
                ) : (
                  <span className={ok || applied ? "cc-ok" : "cc-no"}>{ok || applied ? `✓ ${status}` : "✗ Not eligible"}</span>
                )}
                <Link href={href} className="cc-btn">
                  View brief →
                </Link>
              </>
            )}
          </div>
        </div>
      </article>

      {/* ---------- Compact card (mobile, logged in) ---------- */}
      {!guest && mobile !== "dark" && (
        <article className="ck">
          <Link href={href} className="ck-title">
            {c.title}
          </Link>
          <p className="ck-brand">{c.brand}</p>
          <span className={`ck-type ck-type--${c.type}`}>{TYPE_ICON[c.type]}</span>
          <p className="ck-meta">
            {c.worth && (
              <span>
                🎁 Worth <b>{c.worth}</b>
              </span>
            )}
            {c.till && (
              <span>
                🗓 Till <b>{c.till}</b>
              </span>
            )}
            <span>📍 {c.city}</span>
            <span>📱 Instagram</span>
          </p>
          <div className="ck-foot">
            <Link href={href} className="ck-more">
              View details →
            </Link>
            <Link href={href} className={`ck-status ${ok || applied ? "is-ok" : ""}`}>
              {status}
            </Link>
          </div>
        </article>
      )}

      <style>{`
        .cc-wrap { display: contents; }
        .ck { display: none; }

        /* Visual (Figma: Home / Discover desktop) */
        .cc { display: flex; flex-direction: column; overflow: hidden; border-radius: 16px; background: #f6e9cb; border: 1px solid #e6d5ae; box-shadow: 0 14px 26px -18px rgba(60,40,10,.55); transition: transform .2s, box-shadow .2s; }
        .cc:hover { transform: translateY(-2px); box-shadow: 0 20px 34px -20px rgba(60,40,10,.65); }
        .cc-img { position: relative; display: block; height: 150px; overflow: hidden; }
        .cc-img img { width: 100%; height: 100%; object-fit: cover; }
        .cc-type { position: absolute; top: 10px; right: 10px; padding: 3px 9px; border-radius: 999px; background: rgba(20,35,26,.86); border: 1px solid rgba(232,176,74,.55); color: #e8b04a; font-family: var(--bx-jak); font-size: 10px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; line-height: 1.2; }
        .cc-body { flex: 1; display: flex; flex-direction: column; padding: 14px 12px 12px; }
        .cc-brand { margin: 0; font-family: var(--bx-jak); font-size: 10.5px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase; color: #7a6a4a; line-height: 1.3; }
        .cc-title { margin: 3px 0 6px; font-family: var(--bx-serif); font-size: 19px; font-weight: 600; line-height: 1.25; color: #14231a; }
        .cc-title a:hover { color: var(--bx-red); }
        .cc-reward { display: flex; align-items: center; gap: 6px; margin: 0 0 4px; font-family: var(--bx-jak); font-size: 13px; font-weight: 700; color: #c0702a; }
        .cc-line { margin: 0 0 3px; font-size: 12.5px; color: #3e4b52; line-height: 1.4; }
        .cc-line svg { display: none; }
        .cc-line--who { padding-left: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .cc-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 14px; }
        .cc-no { font-size: 12px; font-weight: 700; color: #b8401f; }
        .cc-ok { font-size: 12px; font-weight: 700; color: var(--bx-ok); }
        .cc-fit { font-family: var(--bx-jak); font-size: 12.5px; font-weight: 600; color: #2e9c94; }
        .cc-btn { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px; border-radius: 999px; background: #123524; color: #fbf3e2; font-family: var(--bx-jak); font-size: 12px; font-weight: 700; white-space: nowrap; }
        .cc-btn:hover { filter: brightness(1.15); }

        /* Compact (Figma: Discover mobile) */
        .ck { flex-direction: column; padding: 14px 16px; border-radius: 18px; background: #fbf0d8; border: 1px solid #e6d5ae; box-shadow: 0 10px 22px -18px rgba(0,0,0,.5); }
        .ck-title { font-size: 16px; font-weight: 700; color: #14231a; line-height: 1.3; }
        .ck-brand { margin: 2px 0 10px; font-size: 13px; color: #6b5a3a; }
        .ck-type { align-self: flex-start; padding: 4px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #123b2a; background: #f6e2b5; }
        .ck-type--barter { color: #b45309; background: #fde4c4; }
        .ck-type--paid { color: #123b2a; background: #dcefd9; }
        .ck-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 10px 0 0; font-size: 12.5px; color: #6b5a3a; line-height: 1.5; }
        .ck-meta b { font-weight: 600; color: #14231a; }
        .ck-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e6d5ae; }
        .ck-more { font-size: 12.5px; font-weight: 600; color: #103b2a; }
        .ck-status { display: inline-flex; align-items: center; height: 40px; padding: 0 22px; border-radius: 999px; border: 1px solid #e2d3b0; background: #fffaf0; font-family: var(--bx-jak); font-size: 14px; font-weight: 700; color: #14231a; }
        .ck-status.is-ok { background: #123524; border-color: #123524; color: #fbf3e2; }

        /* Guest card: halka badge (Figma guest explore) */
        .cc-wrap--guest .cc-type { background: #fbf1dc; border-color: #e8b04a; color: #8a5d14; }

        @media (max-width: 767px) {
          .cc-wrap:not(.cc-wrap--row) .cc { display: none; }
          .cc-wrap:not(.cc-wrap--row) .ck { display: flex; }
          /* Photo-left card (guest + dark) */
          .cc-wrap--row .cc { flex-direction: row; }
          .cc-wrap--row .cc-img { width: 42%; height: auto; min-height: 160px; flex-shrink: 0; }
          .cc-wrap--row .cc-body { min-width: 0; padding: 12px 10px 12px 12px; }
          .cc-wrap--row .cc-title { font-size: 17px; }
          .cc-wrap--guest .cc-type { top: auto; bottom: 8px; left: 8px; right: auto; }
          .cc-wrap--guest .cc-brand { font-size: 10.5px; }
          .cc-wrap--guest .cc-foot { flex-direction: column; align-items: stretch; gap: 6px; }
          /* Dark (Figma: Discover filter / locked mobile) */
          .cc-wrap--dark .cc { background: rgba(10,34,25,.78); border-color: rgba(232,176,74,.5); }
          .cc-wrap--dark .cc { position: relative; }
          .cc-wrap--dark .cc-img { position: static; }
          .cc-wrap--dark .cc-type { top: 12px; right: 10px; background: transparent; border: 1px solid #e8b04a; }
          .cc-wrap--dark .cc-brand { font-size: 13px; letter-spacing: .6px; color: #fbf3e2; padding-right: 60px; }
          .cc-wrap--dark .cc-title { margin-top: 4px; color: #fbf3e2; }
          .cc-wrap--dark .cc-reward { font-size: 13.5px; color: #f0b94a; }
          .cc-wrap--dark .cc-line { color: #d9cdb2; padding-left: 0; }
          .cc-wrap--row .cc-line svg { display: inline; margin-right: 6px; vertical-align: -1px; opacity: .8; }
          .cc-wrap--row .cc-line { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cc-wrap--dark .cc-line { padding-right: 0; }
          .cc-wrap--dark .cc-foot { padding-top: 10px; }
          .cc-wrap--dark .cc-fit { color: #3fd9e8; }
          .cc-wrap--dark .cc-btn { background: transparent; border: 1.5px solid #3fd9e8; padding: 0 11px; }
          .cc-wrap--guest .cc-btn { justify-content: center; padding: 0 8px; font-size: 11.5px; }
        }
      `}</style>
    </div>
  );
}
