"use client";

import { useMemo, useState } from "react";
import { BRANDS } from "@/components/admin/data";

/* Creator upload ke common hisse (Figma 071–073 teeno mein repeat) */

export const NO_BRAND = "— No brand —";
export const NO_CAMP = "— None (just an invite) —";
export const CU_CAMPAIGNS = ["Mysore Pizzeria Launch", "Home Spa", "Circle Diwali Declutter", "Beardo Detan Express Kit", "Vaaree Biggest Diwali Sale"];

/* sessionStorage mein brand/campaign yaad (steps ke beech) — na mile to default */
export const cuLoad = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem("geek_cu") || "null");
  } catch {
    return null;
  }
};
export const cuSave = (v) => {
  try {
    window.sessionStorage.setItem("geek_cu", JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

/** For brand + Not selected for campaign */
export function TargetFields({ brand, camp, onBrand, onCamp }) {
  return (
    <div className="cut">
      <div>
        <p className="cut-l">
          <b>For brand</b> optional — the message names the brand, and they show on its Brand CRM page
        </p>
        <select className="ad-input cut-sel" value={brand} onChange={(e) => onBrand(e.target.value)} aria-label="For brand">
          {[NO_BRAND, ...BRANDS.map((b) => b.name)].map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
      </div>
      <div>
        <p className="cut-l">
          <b>Not selected for campaign</b> optional — tells them they weren’t selected for this campaign and invites them to explore the others
        </p>
        <select className="ad-input cut-sel" value={camp} onChange={(e) => onCamp(e.target.value)} aria-label="Not selected for campaign">
          {[NO_CAMP, ...CU_CAMPAIGNS].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <style>{`
        .cut { display: grid; grid-template-columns: 626fr 432fr; gap: 20px 18px; }
        .cut-l { font-size: 12px; line-height: 1.55; color: var(--ad-muted); }
        .cut-l b { font-size: 14px; font-weight: 700; color: var(--ad-ink); margin-right: 2px; }
        .cut-sel { width: 194px; max-width: 100%; height: 44px; margin-top: 7px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .cut > div:last-child .cut-sel { width: 215px; }
        @media (max-width: 767px) { .cut { grid-template-columns: 1fr; } .cut-sel, .cut > div:last-child .cut-sel { width: 100%; } }
      `}</style>
    </div>
  );
}

/** WhatsApp + email preview */
export function MessagePreview({ brand, camp }) {
  const notSel = camp !== NO_CAMP;
  return (
    <div className="cum">
      <p className="cum-h">
        <b>Message that will be sent</b> (sample name “Asha” — each creator gets their own first name)
      </p>
      <div className="cum-grid">
        <div className="cum-card">
          <p className="cum-t">
            💬 WhatsApp · template creator_registration_update · Utility <span className="ad-badge ad-badge--green">Approved</span>
          </p>
          <div className="cum-msg">
            <p>Hi,</p>
            <p>This is an update on your creator registration with Geek Creative Agency: your details have been added to our creator list.</p>
            <p>Please complete your registration with this WhatsApp number using the button below.</p>
            <p>
              Team @GeekAnimals
              <br />[ Complete registration ]
            </p>
          </div>
          <p className="cum-stop">Reply STOP to stop WhatsApp updates</p>
        </div>
        <div className="cum-card">
          <p className="cum-t">✉️ Email · {notSel ? `Update on ${camp} — explore more campaigns on Geek OS` : "You are invited to Geek OS — explore live campaigns"}</p>
          <div className="cum-msg">
            <p>Hi Asha,</p>
            {notSel ? (
              <>
                <p>
                  Thank you for your interest in the campaign <b>{camp}</b>. This is an update on your application: you were not selected this time.
                </p>
                <p>There are more live campaigns on Geek OS that may suit you — explore them and apply.</p>
              </>
            ) : (
              <>
                <p>Thank you for your interest in working with Geek Creative Agency. You are invited to join Geek OS, our creator platform for brand campaigns.</p>
                <p>Explore the live campaigns and apply to the ones that match your profile.</p>
              </>
            )}
          </div>
          <span className="ad-btn ad-btn--primary cum-btn">Explore campaigns</span>
        </div>
      </div>
      <style>{`
        .cum { margin-top: 17px; }
        .cum-h { font-size: 12px; color: var(--ad-muted); }
        .cum-h b { font-size: 14px; font-weight: 700; color: var(--ad-ink); margin-right: 2px; }
        .cum-grid { display: grid; grid-template-columns: 626fr 432fr; gap: 18px; margin-top: 12px; align-items: start; }
        .cum-card { padding: 20px 19px 20px; border-radius: 16px; border: 1px solid var(--ad-line); }
        .cum-t { font-size: 12px; font-weight: 700; line-height: 1.35; color: var(--ad-ink); }
        .cum-t .ad-badge { height: 26px; margin-left: 2px; }
        .cum-msg { margin-top: 3px; padding: 12px 12px; border-radius: 12px; background: var(--ad-soft-2); }
        .cum-msg p { font-size: 13px; line-height: 20px; color: var(--ad-ink); }
        .cum-msg p + p { margin-top: 20px; }
        .cum-msg b { font-weight: 700; }
        .cum-stop { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cum-btn { margin-top: 10px; height: 41px; cursor: default; }
        @media (max-width: 1023px) { .cum-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

/** Choose file / Google sheet */
export function UploadBar({ onLoad }) {
  const [link, setLink] = useState("");
  return (
    <div className="cub">
      <div className="cub-row">
        <label className="ad-btn ad-btn--primary cub-file">
          📄 Choose Excel / CSV
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && onLoad(e.target.files[0].name)} hidden />
        </label>
        <input className="ad-input cub-link" placeholder="…or paste a Google Sheet link" value={link} onChange={(e) => setLink(e.target.value)} aria-label="Google Sheet link" />
        <button type="button" className="ad-btn ad-btn--ghost cub-load" onClick={() => onLoad(link.trim() ? "Google Sheet" : "Mysore creators.xlsx")}>
          Load sheet
        </button>
      </div>
      <p className="cub-hint">Columns it understands: Name · Instagram (link or @handle) · WhatsApp · Email · City · State · Followers · Category. At least WhatsApp, email or Instagram is needed.</p>
      <style>{`
        .cub { margin-top: 18px; }
        .cub-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .cub-file { height: 41px; cursor: pointer; }
        .cub-link { width: 270px; height: 42px; }
        .cub-load { height: 41px; border-color: var(--ad-line-2); }
        .cub-hint { margin-top: 18px; font-size: 12px; line-height: 1.45; color: var(--ad-muted); }
        @media (max-width: 640px) { .cub-file { flex: 1 1 100%; } .cub-link { flex: 1; width: auto; min-width: 0; } }
      `}</style>
    </div>
  );
}

const UPLOADED = [
  { name: "Asha Rao", handle: "@asha.creates", wa: "+91 98765•••10", city: "Mumbai, MH", fol: "18.2k", joined: false, note: "invited 1× · last 11 Nov · WhatsApp ✓ delivered", brand: "Olio Pizza", act: "Resend" },
  { name: "Kabir Sen", handle: "@kabir.cooks", wa: "+91 98300•••45", city: "Kolkata, WB", fol: "9.4k", joined: "Joined 11 Nov" },
  { name: "Meera Shah", handle: "@meera.styles", wa: "+91 90000•••11", city: "Pune, MH", fol: "12.7k", joined: false, note: "invited 2× · last 10 Nov", brand: "Olio Pizza", act: "Resend" },
  { name: "Tara Bose", handle: "@tara.eats", wa: "—", city: "Kolkata, WB", fol: "6.1k", joined: false, note: "not messaged yet", act: "Send invite" },
];

/** Uploaded creators list (search + filter + resend + delete) */
export function UploadedCreators({ extra = [] }) {
  const [list, setList] = useState(UPLOADED);
  const [q, setQ] = useState("");
  const [who, setWho] = useState("Everyone");
  const [sent, setSent] = useState({});
  const all = [...extra, ...list];
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all.filter(
      (r) =>
        (!t || [r.name, r.handle, r.wa, r.city].some((v) => v.toLowerCase().includes(t))) &&
        (who === "Everyone" || (who === "Joined Geek OS" ? r.joined : !r.joined))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, who, list, extra]);

  const send = (r) => setSent({ ...sent, [r.handle]: true });

  return (
    <section className="ad-card cuu">
      <div className="cuu-top">
        <div>
          <h2 className="ad-h2">Uploaded creators</h2>
          <p className="cuu-sub">{(1240 + extra.length).toLocaleString("en-IN")} uploaded · 96 joined Geek OS</p>
        </div>
        <div className="cuu-f">
          <input className="ad-input" placeholder="🔎 Name, @handle, phone, city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search uploaded creators" />
          <select className="ad-input" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Status">
            {["Everyone", "Not registered", "Joined Geek OS"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="cuu-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>WhatsApp</th>
              <th>City</th>
              <th>Followers</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.handle}>
                <td>
                  <strong className="cuu-n">{r.name}</strong>
                  <span className="cuu-h">{r.handle}</span>
                  {r.brand && <span className="ad-badge cuu-b">🏢 {r.brand}</span>}
                </td>
                <td>{r.wa}</td>
                <td>{r.city}</td>
                <td>{r.fol}</td>
                <td>
                  {r.joined ? (
                    <span className="ad-badge ad-badge--green">✓ {r.joined}</span>
                  ) : (
                    <>
                      <span className="ad-badge ad-badge--orange">Not registered</span>
                      <span className="cuu-note">{sent[r.handle] ? "invite sent just now" : r.note}</span>
                    </>
                  )}
                </td>
                <td>
                  <div className="cuu-acts">
                    {!r.joined && (
                      <button type="button" className="cuu-btn" onClick={() => send(r)} disabled={sent[r.handle]}>
                        {sent[r.handle] ? "✓ Sent" : `↻ ${r.act}`}
                      </button>
                    )}
                    <button type="button" className="cuu-del" aria-label={`Delete ${r.name}`} onClick={() => setList((l) => l.filter((x) => x.handle !== r.handle))}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="cuu-empty">No uploaded creators match.</p>}
      </div>
      <style>{`
        .cuu { margin-top: 20px; padding: 22px 22px 18px; }
        .cuu-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .cuu-top .ad-h2 { margin-top: 8px; }
        .cuu-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cuu-f { display: flex; gap: 10px; }
        .cuu-f .ad-input:first-child { width: 270px; height: 44px; }
        .cuu-f select { width: 159px; height: 44px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .cuu-wrap { margin-top: 26px; overflow-x: auto; }
        .cuu .ad-table th { background: transparent; padding: 12px 11px; }
        .cuu .ad-table th:nth-child(1) { width: 12.5%; }
        .cuu .ad-table th:nth-child(2) { width: 13.5%; }
        .cuu .ad-table th:nth-child(3) { width: 11.2%; }
        .cuu .ad-table th:nth-child(4) { width: 10.7%; }
        .cuu .ad-table td { padding: 14px 11px; }
        .cuu-n { display: block; font-weight: 700; }
        .cuu-h { display: block; margin-top: 1px; font-size: 12px; }
        .cuu-b { margin-top: 4px; }
        .cuu-note { display: block; margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
        .cuu-acts { display: flex; align-items: center; gap: 14px; }
        .cuu-btn { height: 40px; padding: 0 15px; border-radius: 11px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 13px; font-weight: 800; color: var(--ad-primary-ink); }
        .cuu-btn:hover:not(:disabled) { border-color: var(--ad-primary); }
        .cuu-btn:disabled { color: var(--ad-green); cursor: default; }
        .cuu-del { border: 0; background: none; padding: 4px; font-size: 13px; opacity: .7; }
        .cuu-del:hover { opacity: 1; }
        .cuu-empty { padding: 24px 0; text-align: center; color: var(--ad-muted); }
        @media (max-width: 640px) {
          .cuu { padding: 18px 16px 14px; }
          .cuu-f { width: 100%; }
          .cuu-f .ad-input:first-child { flex: 1; width: auto; min-width: 0; }
          .cuu-f select { width: 130px; }
        }
      `}</style>
    </section>
  );
}
