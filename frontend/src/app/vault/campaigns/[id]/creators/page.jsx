"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast } from "@/components/admin/campaign/live";
import { CreatorRow, buildRows, runAction, useAsk, sendWhatsApp, loadTemplates, rejectionReasons } from "@/components/admin/campaign/journey";

/* Journey boxes — tap karo to list filter hoti hai (count asli rows se) */
const BOXES = [
  { l: "Total", s: "everyone active", f: (c) => !c.failed },
  { l: "Invited", s: "not registered", f: (c) => !c.registered },
  { l: "Registered", s: "on Geek OS", f: (c) => c.registered },
  { l: "No Instagram", s: "signed up, not linked", f: (c) => c.registered && !c.ig },
  { l: "Instagram", s: "media kit connected", f: (c) => c.ig },
  { l: "Applied", s: "waiting", f: (c) => c.applied && c.registered && !c.failed },
  { l: "Approved", s: "brand said yes", f: (c) => c.approved },
  { l: "Contract signed", f: (c) => c.step >= 5 },
  { l: "Address confirmed", s: "brief sent", f: (c) => c.step >= 6 },
  { l: "Courier sent", f: (c) => c.step >= 7 },
  { l: "Delivered", f: (c) => c.step >= 9 },
  { l: "Video submitted", f: (c) => c.step >= 11 },
  { l: "No video yet", s: "got product", f: (c) => c.step >= 9 && c.step < 11 },
  { l: "Client approved", f: (c) => c.step >= 11 && (c.kind === "i" ? ["client_approved", "posted"].includes(c.i?.status) : ["content_approved", "published", "completed"].includes(c.x?.stage)) },
  { l: "Done", s: "every post up", f: (c) => c.posted },
];

/* Figma: Campaign workspace — Creators (journey + rows) — barter_tracker + campaign_people */
export default function WorkspaceCreators() {
  const { id } = useParams();
  const router = useRouter();
  const c = { id };
  const { c: camp } = useCampaign(id);
  const on = !!id && id !== "sample";
  const bt = useRpc("admin", "api.barter_tracker", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !on, refreshMs: 300000 });
  const prog = useRpc("admin", "api.campaign_deliverable_progress", { p_campaign: id }, { skip: !on });
  const [box, setBox] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Sort: furthest step");
  const [who, setWho] = useState("Everyone");
  const [size, setSize] = useState("Any size");
  const [posted, setPosted] = useState("Posted or not");
  const [sel, setSel] = useState([]);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useToast(3200);
  const [askEl, ask] = useAsk();

  const reload = () => {
    bt.reload(true);
    people.reload(true);
    prog.reload(true);
  };
  const all = useMemo(() => buildRows({ tracker: bt.data, people: people.data, progress: prog.data || {}, kind: camp?.campaign_type || "barter" }), [bt.data, people.data, prog.data, camp]);
  const counts = BOXES.map((b) => all.filter(b.f).length);

  const rows = useMemo(() => {
    let r = all.filter(BOXES[box].f).filter((x) => `${x.name} ${x.handle} ${x.phone} ${x.city} ${x.x?.phone || x.i?.phone || ""}`.toLowerCase().includes(q.trim().toLowerCase()));
    if (who === "Creator’s turn") r = r.filter((x) => x.turnWho === "creator");
    if (who === "Our turn") r = r.filter((x) => x.turnWho === "you");
    if (size === "Under 10k") r = r.filter((x) => x.followersN < 10000);
    if (size === "10k – 50k") r = r.filter((x) => x.followersN >= 10000 && x.followersN <= 50000);
    if (posted === "Posted") r = r.filter((x) => x.posted);
    if (posted === "Not posted") r = r.filter((x) => !x.posted);
    r = [...r];
    if (sort === "Sort: furthest step") r.sort((a, b) => b.step - a.step || b.sortStep - a.sortStep);
    if (sort === "Sort: name") r.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Sort: followers") r.sort((a, b) => b.followersN - a.followersN);
    return r;
  }, [all, box, q, sort, who, size, posted]);

  const allIds = rows.map((r) => r.id);
  const allOn = allIds.length > 0 && allIds.every((x) => sel.includes(x));
  const toggle = (cid) => setSel((s) => (s.includes(cid) ? s.filter((x) => x !== cid) : [...s, cid]));
  const keyOf = (rid) => (rid[0] === "p" ? "p:" : "i:") + rid.slice(2);
  const ctx = { campaignId: id, ask, say: setToast, reload, router };

  const act = async (x) => {
    if (!x.act) return;
    setBusy(x.id);
    await runAction(x.act.key, x, ctx);
    setBusy("");
  };

  /* 💬 WhatsApp to selected — template ya apna message (purana ccWaSend) */
  const waSelected = async () => {
    const tpls = await loadTemplates();
    const v = await ask({
      title: `💬 WhatsApp to ${sel.length} creator${sel.length > 1 ? "s" : ""}`,
      text: "Pick a template, or type your own message (typed messages only reach creators who wrote to you in the last 24 hours).",
      ok: "Send on WhatsApp",
      fields: [
        { k: "tpl", label: "Template", options: tpls.map((t) => [t.name, t.name.replace(/^geek_/, "").replace(/_/g, " ")]) },
        { k: "text", label: "…or your own message", area: true, placeholder: "Leave empty to send the template" },
      ],
    });
    if (!v) return;
    if (!v.tpl && !v.text.trim()) return setToast("Pick a template or type a message.");
    setBusy("wa");
    const r = await sendWhatsApp({ campaignId: id, keys: sel.map(keyOf), template: v.text.trim() ? null : v.tpl, text: v.text.trim() });
    setBusy("");
    if (r.cancelled) return;
    setToast(r.msg);
    if (!r.bad?.length && r.ok) setSel([]);
    reload();
  };

  /* ✖ Decline selected — sirf Applied / Screened wale (screen_participation, ek reason sabko) */
  const declinable = sel.map((rid) => all.find((x) => x.id === rid)).filter((x) => x && x.kind === "p" && ["applied", "eligible"].includes(x.x.stage));
  const declineSel = async () => {
    if (!declinable.length) return setToast("Tick creators who are on Applied first.");
    const reasons = await rejectionReasons();
    const v = await ask({ title: `Decline ${declinable.length} creator${declinable.length > 1 ? "s" : ""} — why don't they fit the brief?`, text: "The same reason and message go to each of them on WhatsApp, email and in the app.", ok: "Decline & send message", danger: true, fields: [{ k: "code", label: "Reason", options: reasons.map((r) => [r.code, r.label]), required: true }, { k: "note", label: "Message to the creator", area: true, required: true }] });
    if (!v) return;
    setBusy("decl");
    let ok = 0;
    const bad = [];
    for (const x of declinable) {
      const { error } = await rpc("admin", "api.screen_participation", { p_participation: x.pid, p_eligible: false, p_reason: v.note || v.code });
      if (error) bad.push(`${x.handle || x.name}: ${errText(error)}`);
      else ok++;
    }
    setBusy("");
    setToast(`✓ ${ok} declined — the message went to each of them${bad.length ? ` · ${bad.length} couldn't be declined (${bad[0]})` : ""}`);
    setSel([]);
    reload();
  };

  /* ↻ Resend invite to not-registered (bulk_resend_invite har invite par) */
  const notReg = all.filter((x) => x.kind === "i" && !x.registered);
  const resendAll = async () => {
    if (!notReg.length) return setToast("Everyone has registered — nobody to re-invite.");
    if (!window.confirm(`Resend the invite to ${notReg.length} creator${notReg.length > 1 ? "s" : ""} who haven’t registered yet?`)) return;
    setBusy("re");
    let ok = 0;
    let last = null;
    for (const x of notReg) {
      const { error } = await rpc("admin", "api.bulk_resend_invite", { p_invite: x.iid });
      if (error) last = error;
      else ok++;
    }
    setBusy("");
    setToast(last ? `${ok} re-sent · ${errText(last)}` : `↻ Invite re-sent to ${ok} not-registered creator${ok > 1 ? "s" : ""}`);
    reload();
  };

  const loading = bt.loading || people.loading;
  const err = bt.error || people.error;
  const n = (i) => (loading ? "…" : counts[i]);

  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={camp} />

      <section className="ga-card wcr-card">
        <div className="wcr-head">
          <div>
            <h2 className="ga-h2">Creator journey</h2>
            <p className="wcr-sub">Every creator by the step they are on — tap a box to filter.</p>
          </div>
          <div className="wcr-head__act">
            <Link href={`/vault/campaigns/${c.id}/upload`} className="wcr-link">
              📄 Bulk sheet
            </Link>
            <Link href={`/vault/campaigns/${c.id}/find`} className="ga-btn ga-btn--primary wcr-find">
              🎯 Find matching creators
            </Link>
          </div>
        </div>
        <div className="wcr-boxes">
          {BOXES.map((b, i) => (
            <button key={b.l} type="button" className={`wcr-box ${box === i ? "is-on" : ""}`} onClick={() => setBox(i)} aria-pressed={box === i}>
              <strong>{n(i)}</strong>
              <span>{b.l}</span>
              {b.s && <small>{b.s}</small>}
            </button>
          ))}
        </div>
      </section>

      <section className="ga-card wcr-card wcr-list">
        <h2 className="ga-h2">Creators · {box === 0 ? n(0) : `${n(box)} ${BOXES[box].l.toLowerCase()}`}</h2>
        <p className="wcr-sub">Tap a creator to open every step, chat and action.</p>

        <div className="wcr-filters">
          <input className="ga-input wcr-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, @handle, phone, city…" aria-label="Search creators" />
          {[
            [sort, setSort, ["Sort: furthest step", "Sort: name", "Sort: followers"], "Sort"],
            [who, setWho, ["Everyone", "Creator’s turn", "Our turn"], "Whose turn"],
            [size, setSize, ["Any size", "Under 10k", "10k – 50k"], "Follower size"],
            [posted, setPosted, ["Posted or not", "Posted", "Not posted"], "Posted"],
          ].map(([v, set, opts, label]) => (
            <select key={label} className="ga-input wcr-sel" value={v} onChange={(e) => set(e.target.value)} aria-label={label}>
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
            Select all ({rows.length})
          </label>
          <button type="button" className="ga-btn ga-btn--ghost wcr-wa" disabled={!sel.length || busy === "wa"} onClick={waSelected}>
            {busy === "wa" ? "Sending…" : `💬 WhatsApp to selected (${sel.length})`}
          </button>
          <button type="button" className="wcr-txt" disabled={!declinable.length || busy === "decl"} onClick={declineSel}>
            ✖ Decline selected ({declinable.length})
          </button>
          <button type="button" className="wcr-txt" disabled={!notReg.length || busy === "re"} onClick={resendAll}>
            {busy === "re" ? "Sending…" : `↻ Resend invite to not-registered (${notReg.length})`}
          </button>
        </div>
        <button type="button" className="wcr-txt wcr-pick" onClick={() => (setBox(3), setSel(all.filter((x) => x.registered && !x.ig).map((x) => x.id)))}>
          📸 Pick everyone without Instagram
        </button>

        <div className="wcr-rows">
          {rows.map((x) => (
            <CreatorRow
              key={x.id}
              c={x}
              href={`/vault/campaigns/${c.id}/creators/${x.id}`}
              checked={sel.includes(x.id)}
              onCheck={() => toggle(x.id)}
              onAction={() => act(x)}
              busy={busy === x.id}
              onChat={() => router.push(`/vault/campaigns/${c.id}/creators/${x.id}`)}
            />
          ))}
          {!rows.length && (
            <p className="wcr-empty">
              {err ? (
                <>
                  {errText(err)}{" "}
                  <button type="button" className="wcr-txt" onClick={reload}>
                    Retry
                  </button>
                </>
              ) : loading ? (
                "Loading creators…"
              ) : all.length ? (
                "No creators on this step right now."
              ) : (
                "No creators in this campaign yet — add them from Bulk sheet or Find matching creators."
              )}
            </p>
          )}
        </div>
      </section>
      {askEl}
      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        /* Figma: select par arrow nahi */
        select.ga-input { appearance: none; -webkit-appearance: none; }
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
