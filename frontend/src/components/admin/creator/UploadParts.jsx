"use client";

import { useEffect, useState } from "react";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { readSheetFile, splitCsv } from "@/components/admin/campaign2/kit";

/* Creator upload ke common hisse (Figma 071–073 teeno mein repeat).
   Backend purane app jaisa: brand_list · admin_campaigns · creator_upload_preview · creator_upload_v2 ·
   creator_upload_list · creator_upload_resend · creator_upload_delete */

/* sessionStorage mein brand / campaign / sheet yaad (steps ke beech) */
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

/* Sheet ke columns (purane CU_FIELDS + BK_FIELDS regex) */
export const CU_FIELDS = [
  ["name", "Name", /^(full ?name|name|creator( name)?|influencer( name)?)$/i],
  ["handle", "Instagram", /^(?!.*(track|awb|courier|post|reel|stor|video|drive|permalink|a\/c|account ?(no|num|holder|name)|bank|upi|ifsc|holder)).*(insta|^ig\b|handle|username|profile|account|link|url)/i],
  ["phone", "WhatsApp", /^(?!.*(track|awb|courier|pin|zip|postal|follower|a\/c|account|bank|upi|ifsc)).*(whats ?app|phone|mobile|contact( no| number)?|number|cell|wa\b)/i],
  ["email", "Email", /(e-?mail|mail id)/i],
  ["city", "City", /(city|location|place|town)/i],
  ["state", "State", /^(state|province)\b/i],
  ["followers", "Followers", /(follower|followers|reach|fans)/i],
  ["category", "Category", /(categor|niche|genre|content type)/i],
];
const looksLikeHeader = (row) => row.some((c) => CU_FIELDS.some(([, , re]) => re.test(String(c || "")))) && !row.some((c) => /@.+\./.test(c) || /\d{8,}/.test(String(c).replace(/\D/g, "")));
const bkLink = (v) =>
  String(v || "")
    .split(/[\s,;|]+/)
    .filter(Boolean)
    .map((x) => (/^https?:\/\//i.test(x) ? x : /^(www\.|m\.)?(instagram\.com|instagr\.am|[a-z0-9-]+\.[a-z]{2,}\/)/i.test(x) ? "https://" + x : x))
    .join(" ");

/** Sheet ki rows → { head, rows, map, src } (purane cuSetRows jaisa) */
export function sheetOf(raw, src) {
  if (!raw || !raw.length) throw new Error("No rows found in that file.");
  let head = raw[0],
    body = raw.slice(1);
  if (!looksLikeHeader(head)) {
    head = head.map((_, i) => `Column ${i + 1}`);
    body = raw;
  }
  const width = Math.max(...raw.map((r) => r.length));
  head = Array.from({ length: width }, (_, i) => head[i] || `Column ${i + 1}`);
  const map = {},
    used = new Set();
  CU_FIELDS.forEach(([k, , re]) => {
    const i = head.findIndex((h, ix) => !used.has(ix) && re.test(String(h || "")));
    if (i >= 0) {
      map[k] = i;
      used.add(i);
    }
  });
  return { head, map, rows: body.filter((r) => r.some((c) => String(c || "").trim())), src };
}
/** ek sheet row → creator_upload_v2 ki row */
export const cuRow = (map, r) => {
  const g = (k) => (map[k] != null ? String(r[map[k]] || "").trim() : "");
  return { name: g("name"), handle: bkLink(g("handle")), phone: g("phone"), email: g("email"), city: g("city"), state: g("state"), followers: g("followers"), category: g("category") };
};

/** Google Sheet link → rows ("Anyone with the link" chahiye) — purane bkReadSheetLink jaisa */
export async function readSheetLink(url) {
  const id = (url.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!id) {
    if (/docs\.google\.com\/document/.test(url)) throw new Error("That's a Google Doc — open it, choose File → Download → Microsoft Word (.docx) and upload the file here.");
    throw new Error("Paste the link of a Google Sheet (docs.google.com/spreadsheets/…).");
  }
  const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1] || "0";
  const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`).catch(() => null);
  const text = r && r.ok ? await r.text() : "";
  if (!text || /^\s*</.test(text)) throw new Error("Couldn't open the sheet. In Google Sheets tap Share → General access → “Anyone with the link” (Viewer), then try again — or download it as .xlsx / .csv and upload.");
  return splitCsv(text);
}

/** For brand + Not selected for campaign (value = brand_id / campaign id, "" = none) */
export function TargetFields({ brand, camp, onBrand, onCamp }) {
  const { data: brands } = useRpc("admin", "api.brand_list", { p_q: null });
  const { data: camps } = useRpc("admin", "admin_campaigns", { p_status: null });
  return (
    <div className="cut">
      <div>
        <p className="cut-l">
          <b>For brand</b> optional — the message names the brand, and they show on its Brand CRM page
        </p>
        <select className="ga-input cut-sel" value={brand || ""} onChange={(e) => onBrand(e.target.value)} aria-label="For brand">
          <option value="">— No brand —</option>
          {(brands || []).map((b) => (
            <option key={b.brand_id} value={b.brand_id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="cut-l">
          <b>Not selected for campaign</b> optional — tells them they weren’t selected for this campaign and invites them to explore the others
        </p>
        <select className="ga-input cut-sel" value={camp || ""} onChange={(e) => onCamp(e.target.value)} aria-label="Not selected for campaign">
          <option value="">— None (just an invite) —</option>
          {(camps || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
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

/* WhatsApp *bold* → <b>, har line ek <p> */
const Fmt = ({ text }) =>
  String(text || "")
    .split("\n")
    .map((line, i) => (
      <p key={i}>
        {line.split(/(\*[^*\n]+\*)/g).map((part, j) => (/^\*[^*]+\*$/.test(part) ? <b key={j}>{part.slice(1, -1)}</b> : part))}
      </p>
    ));

/** WhatsApp + email preview — creator_upload_preview (wahi message jo jayega) */
export function MessagePreview({ brand, camp }) {
  const { data: t, error } = useRpc("admin", "api.creator_upload_preview", { p_brand: brand || null, p_campaign: camp || null });
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const wa = String((t && t.whatsapp_text) || "").replace("{{link}}", `${origin}/creator/explore`);
  return (
    <div className="cum">
      <p className="cum-h">
        <b>Message that will be sent</b> (sample name “Asha” — each creator gets their own first name)
      </p>
      {error && <p className="cum-stop">{errText(error)}</p>}
      <div className="cum-grid">
        <div className="cum-card">
          <p className="cum-t">
            💬 WhatsApp · template {(t && (t.wa_template || t.template)) || "…"} · Utility <span className="ga-badge ga-badge--green">Approved</span>
          </p>
          <div className="cum-msg">{t ? <Fmt text={wa} /> : <p>Loading…</p>}</div>
          <p className="cum-stop">Reply STOP to stop WhatsApp updates</p>
          {t && t.template && !t.template_live && (
            <p className="cum-stop">
              The “not selected” template {t.template} is waiting for Meta — until it&apos;s approved, this message goes (same link). The email already says “not selected”.
            </p>
          )}
        </div>
        <div className="cum-card">
          <p className="cum-t">✉️ Email · {(t && t.subject) || "…"}</p>
          <div className="cum-msg">{t ? <Fmt text={t.email_text} /> : <p>Loading…</p>}</div>
          <span className="ga-btn ga-btn--primary cum-btn">Explore campaigns</span>
        </div>
      </div>
      <style>{`
        .cum { margin-top: 17px; }
        .cum-h { font-size: 12px; color: var(--ad-muted); }
        .cum-h b { font-size: 14px; font-weight: 700; color: var(--ad-ink); margin-right: 2px; }
        .cum-grid { display: grid; grid-template-columns: 626fr 432fr; gap: 18px; margin-top: 12px; align-items: start; }
        .cum-card { padding: 20px 19px 20px; border-radius: 16px; border: 1px solid var(--ad-line); min-width: 0; }
        .cum-t { font-size: 12px; font-weight: 700; line-height: 1.35; color: var(--ad-ink); overflow-wrap: anywhere; }
        .cum-t .ga-badge { height: 26px; margin-left: 2px; }
        .cum-msg { margin-top: 3px; padding: 12px 12px; border-radius: 12px; background: var(--ad-soft-2); }
        .cum-msg p { font-size: 13px; line-height: 20px; color: var(--ad-ink); min-height: 20px; overflow-wrap: anywhere; }
        .cum-msg b { font-weight: 700; }
        .cum-stop { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cum-btn { margin-top: 10px; height: 41px; cursor: default; }
        @media (max-width: 1023px) { .cum-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

/** Choose file / Google sheet → onLoad(sheet) */
export function UploadBar({ onLoad }) {
  const [link, setLink] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const take = async (fn, src) => {
    setErr("");
    setBusy(true);
    try {
      onLoad(sheetOf(await fn(), src));
    } catch (e) {
      setErr(e.message || String(e));
    }
    setBusy(false);
  };
  return (
    <div className="cub">
      <div className="cub-row">
        <label className="ga-btn ga-btn--primary cub-file">
          {busy ? "Reading…" : "📄 Choose Excel / CSV"}
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.txt,.ods"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) take(() => readSheetFile(f), f.name);
              e.target.value = "";
            }}
            hidden
          />
        </label>
        <input className="ga-input cub-link" placeholder="…or paste a Google Sheet link" value={link} onChange={(e) => setLink(e.target.value)} aria-label="Google Sheet link" />
        <button type="button" className="ga-btn ga-btn--ghost cub-load" disabled={!link.trim() || busy} onClick={() => take(() => readSheetLink(link.trim()), "Google Sheet")}>
          Load sheet
        </button>
      </div>
      {err && <p className="cub-err">{err}</p>}
      <p className="cub-hint">Columns it understands: Name · Instagram (link or @handle) · WhatsApp · Email · City · State · Followers · Category. At least WhatsApp, email or Instagram is needed.</p>
      <style>{`
        .cub { margin-top: 18px; }
        .cub-row { display: flex; flex-wrap: wrap; gap: 10px; }
        .cub-file { height: 41px; cursor: pointer; }
        .cub-link { width: 270px; height: 42px; }
        .cub-load { height: 41px; border-color: var(--ad-line-2); }
        .cub-err { margin-top: 10px; padding: 9px 12px; border-radius: 10px; background: var(--ad-red-bg); color: var(--ad-red); font-size: 12.5px; font-weight: 700; }
        .cub-hint { margin-top: 18px; font-size: 12px; line-height: 1.45; color: var(--ad-muted); }
        @media (max-width: 640px) { .cub-file { flex: 1 1 100%; } .cub-link { flex: 1; width: auto; min-width: 0; } }
      `}</style>
    </div>
  );
}

const fdate = (t) => (t ? new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
const fnum = (n) => (n == null ? "—" : Number(n) >= 1000 ? (Number(n) / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));

/** Uploaded creators list — creator_upload_list (search + status + brand) · resend · delete */
export function UploadedCreators({ brand = "" }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [who, setWho] = useState("all");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading, reload } = useRpc("admin", "api.creator_upload_list", { p_q: dq || null, p_status: who, p_limit: 500, p_brand: brand || null });
  const d = data || {};
  const rows = d.rows || [];
  const flash = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2400);
  };

  const resend = async (x) => {
    setBusyId(x.id);
    const r = await rpc("admin", "api.creator_upload_resend", { p_id: x.id });
    setBusyId("");
    flash(r.error ? errText(r.error) : r.data && r.data.status === "joined" ? "They're on Geek OS already ✓" : "Register message sent ✓");
    reload(true);
  };
  const del = async (x) => {
    if (!window.confirm("Delete this uploaded creator? They come off the creator upload list. Nothing is sent.")) return;
    const r = await rpc("admin", "api.creator_upload_delete", { p_id: x.id });
    if (r.error) return flash(errText(r.error));
    flash("Deleted ✓");
    reload(true);
  };

  return (
    <section className="ga-card cuu">
      <div className="cuu-top">
        <div>
          <h2 className="ga-h2">Uploaded creators</h2>
          <p className="cuu-sub">
            {(d.total || 0).toLocaleString("en-IN")} uploaded · {(d.joined || 0).toLocaleString("en-IN")} joined Geek OS
          </p>
        </div>
        <div className="cuu-f">
          <input className="ga-input" placeholder="🔎 Name, @handle, phone, city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search uploaded creators" />
          <select className="ga-input" value={who} onChange={(e) => setWho(e.target.value)} aria-label="Status">
            <option value="all">Everyone</option>
            <option value="waiting">Not registered</option>
            <option value="joined">Joined Geek OS</option>
          </select>
        </div>
      </div>
      <div className="cuu-wrap">
        <table className="ga-table">
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
              <tr key={r.id}>
                <td>
                  <strong className="cuu-n">{r.name || r.member_name || "—"}</strong>
                  {r.handle && (
                    <a className="cuu-h" href={`https://instagram.com/${encodeURIComponent(r.handle)}`} target="_blank" rel="noopener noreferrer">
                      @{r.handle}
                    </a>
                  )}
                  {r.brand && <span className="ga-badge cuu-b">🏢 {r.brand}</span>}
                </td>
                <td>{r.phone || "—"}</td>
                <td>{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>
                <td>{fnum(r.followers)}</td>
                <td>
                  {r.joined ? (
                    <span className="ga-badge ga-badge--green">✓ Joined {fdate(r.joined_at)}</span>
                  ) : (
                    <>
                      <span className="ga-badge ga-badge--orange">Not registered</span>
                      <span className="cuu-note">
                        {r.invites_sent ? `invited ${r.invites_sent}× · last ${fdate(r.last_invited_at)}` : "not messaged yet"}
                        {r.last_wa && r.last_wa.status ? ` · WhatsApp ${r.last_wa.status}` : ""}
                      </span>
                    </>
                  )}
                </td>
                <td>
                  <div className="cuu-acts">
                    {!r.joined && (
                      <button type="button" className="cuu-btn" onClick={() => resend(r)} disabled={busyId === r.id}>
                        {busyId === r.id ? "Sending…" : `↻ ${r.invites_sent ? "Resend" : "Send invite"}`}
                      </button>
                    )}
                    <button type="button" className="cuu-del" aria-label={`Delete ${r.name || "creator"}`} onClick={() => del(r)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && (
          <p className="cuu-empty">
            {errText(error)}{" "}
            <button type="button" className="cuu-retry" onClick={() => reload()}>
              Retry
            </button>
          </p>
        )}
        {!error && loading && !rows.length && <p className="cuu-empty">Loading…</p>}
        {!error && !loading && !rows.length && <p className="cuu-empty">{dq || who !== "all" ? "Nobody matches." : "No creators uploaded yet — choose a sheet above."}</p>}
      </div>
      {toast && <div className="ga-toast">✓ {toast}</div>}
      <style>{`
        .cuu { margin-top: 20px; padding: 22px 22px 18px; }
        .cuu-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .cuu-top .ga-h2 { margin-top: 8px; }
        .cuu-sub { margin-top: 10px; font-size: 12px; color: var(--ad-muted); }
        .cuu-f { display: flex; gap: 10px; }
        .cuu-f .ga-input:first-child { width: 270px; height: 44px; }
        .cuu-f select { width: 159px; height: 44px; color: var(--ad-text); appearance: none; cursor: pointer; }
        .cuu-wrap { margin-top: 26px; overflow-x: auto; }
        .cuu .ga-table th { background: transparent; padding: 12px 11px; }
        .cuu .ga-table th:nth-child(1) { width: 12.5%; }
        .cuu .ga-table th:nth-child(2) { width: 13.5%; }
        .cuu .ga-table th:nth-child(3) { width: 11.2%; }
        .cuu .ga-table th:nth-child(4) { width: 10.7%; }
        .cuu .ga-table td { padding: 14px 11px; }
        .cuu-n { display: block; font-weight: 700; }
        .cuu-h { display: block; margin-top: 1px; font-size: 12px; }
        .cuu-h:hover { color: var(--ad-primary); }
        .cuu-b { margin-top: 4px; }
        .cuu-note { display: block; margin-top: 6px; font-size: 12px; color: var(--ad-muted); }
        .cuu-acts { display: flex; align-items: center; gap: 14px; }
        .cuu-btn { height: 40px; padding: 0 15px; border-radius: 11px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 13px; font-weight: 800; color: var(--ad-primary-ink); }
        .cuu-btn:hover:not(:disabled) { border-color: var(--ad-primary); }
        .cuu-btn:disabled { opacity: .6; cursor: default; }
        .cuu-del { border: 0; background: none; padding: 4px; font-size: 13px; opacity: .7; }
        .cuu-del:hover { opacity: 1; }
        .cuu-retry { border: 0; background: none; font-weight: 800; color: #6657e9; }
        .cuu-empty { padding: 24px 0; text-align: center; color: var(--ad-muted); }
        @media (max-width: 640px) {
          .cuu { padding: 18px 16px 14px; }
          .cuu-f { width: 100%; }
          .cuu-f .ga-input:first-child { flex: 1; width: auto; min-width: 0; }
          .cuu-f select { width: 130px; }
        }
      `}</style>
    </section>
  );
}
