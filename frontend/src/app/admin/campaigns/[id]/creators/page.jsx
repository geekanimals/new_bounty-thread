"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";
import { CreatorRow, WS_CREATORS } from "@/components/admin/campaign/journey";

/* Journey boxes — tap karo to list filter hoti hai */
const BOXES = [
  { n: 66, l: "Total", s: "everyone active", f: () => true },
  { n: 12, l: "Invited", s: "not registered", f: (c) => !c.registered },
  { n: 54, l: "Registered", s: "on Geek OS", f: (c) => c.registered },
  { n: 6, l: "No Instagram", s: "signed up, not linked", f: (c) => c.registered && !c.ig },
  { n: 48, l: "Instagram", s: "media kit connected", f: (c) => c.ig },
  { n: 9, l: "Applied", s: "waiting", f: (c) => c.step === 3 },
  { n: 31, l: "Approved", s: "brand said yes", f: (c) => c.step >= 4 },
  { n: 28, l: "Contract signed", f: (c) => c.step >= 5 },
  { n: 26, l: "Address confirmed", s: "brief sent", f: (c) => c.step >= 6 },
  { n: 24, l: "Courier sent", f: (c) => c.step >= 7 },
  { n: 20, l: "Delivered", f: (c) => c.step >= 9 },
  { n: 14, l: "Video submitted", f: (c) => c.step >= 11 },
  { n: 6, l: "No video yet", s: "got product", f: (c) => c.step >= 9 && c.step < 11 },
  { n: 11, l: "Client approved", f: (c) => c.step >= 12 },
  { n: 10, l: "Done", s: "every post up", f: (c) => c.step >= 12 },
];

/* Figma: Campaign workspace — Creators (journey + rows) */
export default function WorkspaceCreators() {
  const { id } = useParams();
  const router = useRouter();
  const c = campaignById(id);
  const [box, setBox] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Sort: furthest step");
  const [who, setWho] = useState("Everyone");
  const [size, setSize] = useState("Any size");
  const [posted, setPosted] = useState("Posted or not");
  const [sel, setSel] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const rows = useMemo(() => {
    const n = (s) => Number(s.replace(/,/g, ""));
    let r = WS_CREATORS.filter(BOXES[box].f).filter((x) => `${x.name} ${x.handle} ${x.phone} ${x.city}`.toLowerCase().includes(q.trim().toLowerCase()));
    if (who === "Creator’s turn") r = r.filter((x) => x.turn.includes("Creator’s turn"));
    if (who === "Our turn") r = r.filter((x) => x.turn.includes("Our turn"));
    if (size === "Under 10k") r = r.filter((x) => n(x.followers) < 10000);
    if (size === "10k – 50k") r = r.filter((x) => n(x.followers) >= 10000 && n(x.followers) <= 50000);
    if (posted === "Posted") r = r.filter((x) => x.posted);
    if (posted === "Not posted") r = r.filter((x) => !x.posted);
    r = [...r];
    if (sort === "Sort: furthest step") r.sort((a, b) => b.step - a.step);
    if (sort === "Sort: name") r.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Sort: followers") r.sort((a, b) => n(b.followers) - n(a.followers));
    // Figma order (furthest step se nahi) — default view jaisa design mein
    if (sort === "Sort: furthest step" && box === 0 && !q) r = WS_CREATORS.filter((x) => rows0(x, who, size, posted, n));
    return r;
  }, [box, q, sort, who, size, posted]);

  const allIds = rows.map((r) => r.id);
  const allOn = allIds.length > 0 && allIds.every((x) => sel.includes(x));
  const toggle = (cid) => setSel((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]));

  const act = (x) => {
    if (x.action.includes("Resend")) return setToast(`↻ Invite re-sent to ${x.name}`);
    if (x.action.includes("Remind")) return setToast(`▶ Reminder sent to ${x.name} on WhatsApp`);
    if (x.action.includes("Approve")) return setToast(`✅ ${x.name}’s video approved — client notified`);
    setToast(`📸 Connect-Instagram link sent to ${x.name}`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={c.id} />

      <section className="ad-card wcr-card">
        <div className="wcr-head">
          <div>
            <h2 className="ad-h2">Creator journey</h2>
            <p className="wcr-sub">Every creator by the step they are on — tap a box to filter.</p>
          </div>
          <div className="wcr-head__act">
            <Link href={`/admin/campaigns/${c.id}/upload`} className="wcr-link">
              📄 Bulk sheet
            </Link>
            <Link href={`/admin/campaigns/${c.id}/find`} className="ad-btn ad-btn--primary wcr-find">
              🎯 Find matching creators
            </Link>
          </div>
        </div>
        <div className="wcr-boxes">
          {BOXES.map((b, i) => (
            <button key={b.l} type="button" className={`wcr-box ${box === i ? "is-on" : ""}`} onClick={() => setBox(i)} aria-pressed={box === i}>
              <strong>{b.n}</strong>
              <span>{b.l}</span>
              {b.s && <small>{b.s}</small>}
            </button>
          ))}
        </div>
      </section>

      <section className="ad-card wcr-card wcr-list">
        <h2 className="ad-h2">Creators · {box === 0 ? 66 : `${BOXES[box].n} ${BOXES[box].l.toLowerCase()}`}</h2>
        <p className="wcr-sub">Tap a creator to open every step, chat and action.</p>

        <div className="wcr-filters">
          <input className="ad-input wcr-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, @handle, phone, city…" aria-label="Search creators" />
          {[
            [sort, setSort, ["Sort: furthest step", "Sort: name", "Sort: followers"], "Sort"],
            [who, setWho, ["Everyone", "Creator’s turn", "Our turn"], "Whose turn"],
            [size, setSize, ["Any size", "Under 10k", "10k – 50k"], "Follower size"],
            [posted, setPosted, ["Posted or not", "Posted", "Not posted"], "Posted"],
          ].map(([v, set, opts, label]) => (
            <select key={label} className="ad-input wcr-sel" value={v} onChange={(e) => set(e.target.value)} aria-label={label}>
              {opts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
        </div>

        <div className="wcr-bulk">
          <label className="wcr-all">
            <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : allIds)} />
            <span className="wcr-allbox" aria-hidden="true" />
            Select all ({box === 0 ? 66 : rows.length})
          </label>
          <button type="button" className="ad-btn ad-btn--ghost wcr-wa" disabled={!sel.length} onClick={() => (setToast(`💬 WhatsApp sent to ${sel.length} creator(s)`), setSel([]))}>
            💬 WhatsApp to selected ({sel.length})
          </button>
          <button type="button" className="wcr-txt" disabled={!sel.length} onClick={() => (setToast(`✖ ${sel.length} creator(s) declined`), setSel([]))}>
            ✖ Decline selected ({sel.length})
          </button>
          <button type="button" className="wcr-txt" onClick={() => setToast("↻ Invite re-sent to 12 not-registered creators")}>
            ↻ Resend invite to not-registered (12)
          </button>
        </div>
        <button type="button" className="wcr-txt wcr-pick" onClick={() => setSel(WS_CREATORS.filter((x) => !x.ig).map((x) => x.id))}>
          📸 Pick everyone without Instagram
        </button>

        <div className="wcr-rows">
          {rows.map((x) => (
            <CreatorRow
              key={x.id}
              c={x}
              href={`/admin/campaigns/${c.id}/creators/${x.id}`}
              checked={sel.includes(x.id)}
              onCheck={() => toggle(x.id)}
              onAction={() => act(x)}
              onChat={() => router.push(`/admin/campaigns/${c.id}/creators/${x.id}`)}
            />
          ))}
          {!rows.length && <p className="wcr-empty">No creators on this step right now.</p>}
        </div>
      </section>
      {toast && <div className="ad-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ad-input { appearance: none; -webkit-appearance: none; }
        .wcr-card { padding: 22px 22px 22px; }
        .wcr-list { margin-top: 20px; padding-bottom: 30px; }
        .wcr-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .wcr-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .wcr-head__act { display: flex; align-items: center; gap: 16px; padding-top: 2px; }
        .wcr-link { font-size: 14px; font-weight: 800; color: #6657e9; }
        .wcr-find { height: 41px; padding: 0 16px; }
        .wcr-boxes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-top: 20px; }
        .wcr-box { display: flex; flex-direction: column; align-items: flex-start; min-height: 117px; padding: 22px 19px 14px; border-radius: 14px; border: 1px solid var(--ad-line); background: #fff; text-align: left; transition: border-color .15s, box-shadow .15s; }
        .wcr-box:hover { border-color: #cfd2ee; }
        .wcr-box strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; color: var(--ad-ink); }
        .wcr-box span { margin-top: 9px; font-size: 12px; color: var(--ad-muted); }
        .wcr-box small { margin-top: 5px; font-size: 11px; color: var(--ad-faint); }
        .wcr-box.is-on { background: var(--ad-grad); border-color: transparent; box-shadow: 0 16px 30px -18px rgba(103,87,245,.9); }
        .wcr-box.is-on strong { color: #fff; }
        .wcr-box.is-on span, .wcr-box.is-on small { color: #e4ddff; }

        .wcr-filters { display: flex; gap: 9px; flex-wrap: wrap; margin-top: 25px; }
        .wcr-search { width: 270px; height: 43px; }
        .wcr-search::placeholder { color: #757575; }
        .wcr-sel { width: auto; height: 43px; padding: 0 30px 0 12px; font-size: 14px; color: #293652; appearance: none; background: #fff; }
        .wcr-bulk { display: flex; align-items: center; gap: 12px 20px; flex-wrap: wrap; margin-top: 16px; }
        .wcr-all { position: relative; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ad-ink); cursor: pointer; }
        .wcr-all input { position: absolute; opacity: 0; }
        .wcr-allbox { width: 270px; height: 11px; margin-left: 4px; border-radius: 2px; border: 2px solid #4b4f5c; background: #fff; }
        .wcr-all input:checked + .wcr-allbox { background: var(--ad-primary); border-color: var(--ad-primary); }
        .wcr-all input:focus-visible + .wcr-allbox { box-shadow: 0 0 0 3px rgba(103,87,245,.25); }
        .wcr-wa { height: 41px; margin-left: -8px; padding: 0 15px; }
        .wcr-wa:disabled { opacity: 1; cursor: default; }
        .wcr-txt { padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wcr-txt:hover:not(:disabled) { color: var(--ad-primary-2); }
        .wcr-txt:disabled { cursor: default; }
        .wcr-pick { margin: 20px 0 0 8px; }
        .wcr-rows { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
        .wcr-empty { padding: 24px; text-align: center; font-size: 13px; color: var(--ad-muted); }

        @media (max-width: 1180px) { .wcr-allbox { width: 120px; } }
        @media (max-width: 1023px) { .wcr-boxes { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .wcr-card { padding: 18px 16px; }
          .wcr-head__act { width: 100%; justify-content: space-between; }
          .wcr-boxes { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
          .wcr-box { min-height: 0; padding: 14px 12px; }
          .wcr-box:first-child { grid-column: 1 / -1; }
          .wcr-box strong { font-size: 24px; }
          .wcr-box span { margin-top: 6px; }
          .wcr-search { width: 100%; }
          .wcr-sel { flex: 1 1 45%; }
          .wcr-allbox { width: 18px; height: 18px; }
          .wcr-wa { margin-left: 0; width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}

/* Default view: Figma wali order, sirf baaki filters lagao */
function rows0(x, who, size, posted, n) {
  if (who === "Creator’s turn" && !x.turn.includes("Creator’s turn")) return false;
  if (who === "Our turn" && !x.turn.includes("Our turn")) return false;
  if (size === "Under 10k" && n(x.followers) >= 10000) return false;
  if (size === "10k – 50k" && (n(x.followers) < 10000 || n(x.followers) > 50000)) return false;
  if (posted === "Posted" && !x.posted) return false;
  if (posted === "Not posted" && x.posted) return false;
  return true;
}
