"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { rpc, useRpc, errText } from "@/lib/supabase";
import { useCampaign, useToast, campStatusOptions, delivChips, fmtMoney, fmtDate, daysLeft, REPORT_APPROVED, inviteStepRank } from "@/components/admin/campaign/live";

/* Ideal creator profile → ek line (purane idealProfileHtml ka chhota roop) */
function eligLine(ip) {
  ip = ip && typeof ip === "object" ? ip : {};
  const k = (n) => (n >= 1000 ? Math.round(n / 1000) + "k" : String(n));
  const f = ip.min_followers != null ? (ip.max_followers != null ? `${k(ip.min_followers)}–${k(ip.max_followers)} followers` : `${k(ip.min_followers)}+ followers`) : ip.max_followers != null ? `up to ${k(ip.max_followers)} followers` : "";
  return [f, (ip.locations || []).join(", "), (ip.categories || []).join(", "), ip.gender && ip.gender !== "any" ? ip.gender : "", ip.min_engagement != null ? `${ip.min_engagement}%+ eng.` : ""].filter(Boolean).join(" · ") || "Anyone";
}

/* Figma: Campaign workspace — Overview (status, messages, details, tools) — Supabase se */
export default function WorkspaceOverview() {
  const { id } = useParams();
  const router = useRouter();
  const { c: row, loading, error, reload } = useCampaign(id);
  const msg = useRpc("admin", "api.campaign_messaging", { p_campaign: id }, { skip: !id || id === "sample" });
  const auto = useRpc("admin", "api.ops_auto_messages", {}, {});
  const people = useRpc("admin", "api.campaign_people", { p_campaign: id }, { skip: !id || id === "sample" });
  const prog = useRpc("admin", "api.campaign_deliverable_progress", { p_campaign: id }, { skip: !id || id === "sample" });
  const [ask, setAsk] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [delErr, setDelErr] = useState("");
  const [toast, setToast] = useToast();

  const c = { id, name: row?.name || "Campaign" };
  const ct = row?.contract_terms && typeof row.contract_terms === "object" ? row.contract_terms : {};
  const left = daysLeft(row?.end_date);
  const terms = [ct.collab_rights !== false ? "Collab with brand" : "", ct.blacklist_clause !== false ? "blacklist if no video" : "", ct.reship_clause !== false && row?.campaign_type !== "paid" ? "re-ship at their cost" : ""].filter(Boolean);
  const DETAILS = row
    ? [
        ["Each creator posts", delivChips(row.deliverables) || "Not set — Edit"],
        ["Product", [ct.product || "", row.product_value ? fmtMoney(row.product_value) : ""].filter(Boolean).join(" · ") || "—"],
        ["Dates", `${row.start_date ? fmtDate(row.start_date) : "—"} → ${row.end_date ? fmtDate(row.end_date, true) : "—"}${left != null ? ` · ${left < 0 ? "ended" : left === 0 ? "ends today" : `${left} day${left > 1 ? "s" : ""} left`}` : ""}`],
        ["Video due", `${ct.content_days || 7} days after delivery`],
        ["Ad rights", `${ct.ad_rights_months ?? 1} month${(ct.ad_rights_months ?? 1) == 1 ? "" : "s"} · posts stay live`],
        ["Terms", terms.join(" · ") || "—"],
        ["Creators needed", row.creators ? String(row.creators) : "—"],
        ["Eligibility", eligLine(row.ideal_profile)],
      ]
    : [];

  /* status (purana ccStatus) */
  const { list: STATUS, sel: statusSel } = campStatusOptions(row?.status, row?.end_date);
  const setStatus = async (v) => {
    if (!row?.id) return setToast("This campaign has no editable record yet.");
    const lbl = (STATUS.find((x) => x[0] === v) || [v, v])[1].replace(/\s—.*$/, "");
    if (!window.confirm(`Change the campaign status to “${lbl}”?`)) return;
    setBusy("status");
    const { error: e } = await rpc("admin", "admin_set_campaign_status", { p_id: row.id, p_status: v });
    setBusy("");
    if (e) return setToast(errText(e));
    setToast(`Status → ${lbl} ✓`);
    reload();
  };

  /* WhatsApp / Email switches (campaign_messaging + set_campaign_messaging) */
  const m = msg.data || {};
  const autoOff = auto.data && auto.data.auto_on === false;
  const chan = {
    wa: { on: m.global_wa_on !== false && m.wa_on !== false, global: m.global_wa_on, held: m.held_wa },
    mail: { on: m.global_email_on !== false && m.email_on !== false, global: m.global_email_on, held: m.held_email },
  };
  const toggle = async (k, label) => {
    const ch = chan[k];
    if (ch.global === false) return setToast("This is turned off for every campaign in Settings. Turn it on there first.");
    setBusy(k);
    const { data: r, error: e } = await rpc("admin", "api.set_campaign_messaging", { p_campaign: id, p_channel: k === "wa" ? "whatsapp" : "email", p_on: !ch.on });
    setBusy("");
    if (e) return setToast(errText(e));
    setToast(`${label} for this campaign ${!ch.on ? "turned ON ✓" : "turned OFF"}${r && r.held_now ? ` · ${r.held_now} waiting message${r.held_now > 1 ? "s" : ""} stopped` : ""}`);
    msg.reload();
  };
  const chanSub = (ch) => (ch.global === false ? "OFF — paused for all campaigns" : ch.on ? "ON — sending step updates" : ch.held ? `OFF · ${ch.held} stopped while OFF — never sent` : "OFF — for this campaign");

  /* Creator journey (campaign_people + campaign_deliverable_progress) */
  const P = people.data?.participants || [];
  const I = people.data?.invites || [];
  const total = P.length + I.length;
  const approved = P.filter((x) => REPORT_APPROVED(x.stage)).length + I.filter((x) => inviteStepRank(x.status) >= 3).length;
  const pg = prog.data && typeof prog.data === "object" ? Object.values(prog.data) : [];
  const done = pg.filter((v) => v && v.all_done).length + I.filter((x) => x.status === "posted").length;
  const jn = (n) => (people.loading ? "…" : people.error ? "—" : n);

  /* Delete (admin_delete_campaign — naam type karke confirm) */
  const del = async () => {
    if (!row?.id) return setDelErr("This campaign has no editable record yet.");
    if (String(confirm).trim().toLowerCase() !== String(row?.name || "").trim().toLowerCase()) return setDelErr(`Type “${row?.name}” exactly to confirm.`);
    setBusy("del");
    setDelErr("");
    const { error: e } = await rpc("admin", "admin_delete_campaign", { p_campaign: row.id, p_note: note.trim() || null });
    setBusy("");
    if (e) return setDelErr(errText(e));
    setAsk(false);
    router.push("/admin/campaigns");
  };

  const TOOLS = [
    { ic: "🎯", t: "Find matching creators", href: `/admin/campaigns/${c.id}/find` },
    { ic: "📄", t: "Bulk sheet", href: `/admin/campaigns/${c.id}/upload` },
    { ic: "💰", t: "Payments", href: `/admin/campaigns/${c.id}/payments` },
    { ic: "💬", t: "Messages & templates", href: `/admin/campaigns/${c.id}/messages` },
    { ic: "📜", t: "Contract & video brief", href: `/admin/campaigns/${c.id}/contract` },
    { ic: "🔗", t: "Links & codes", href: `/admin/campaigns/${c.id}/attribution` },
    { ic: "✉️", t: "Outreach message", href: `/admin/campaigns/${c.id}/outreach`, short: true },
    { ic: "📋", t: "List for the brand", href: `/admin/campaigns/${c.id}/list`, short: true },
    { ic: "📈", t: "Report", href: `/admin/campaigns/${c.id}/report`, short: true },
    { ic: "🧩", t: "Creator traits", href: `/admin/campaigns/${c.id}/traits`, short: true },
  ];

  if (!loading && (error || !row))
    return (
      <AdminShell>
        <WorkspaceHead id={id} campaign={row} />
        <section className="ga-card" style={{ padding: 22 }}>
          <p style={{ fontSize: 13, color: "var(--ad-muted)" }}>
            {errText(error) || "Couldn’t open this campaign."}{" "}
            <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" onClick={reload}>
              Retry
            </button>
          </p>
        </section>
      </AdminShell>
    );

  return (
    <AdminShell>
      <WorkspaceHead id={id} campaign={row} />

      <div className="wo-grid">
        <div className="wo-col">
          <section className="ga-card wo-card">
            <div className="wo-status">
              <div>
                <h2 className="ga-h2">Campaign status</h2>
                <p className="wo-sub">Who can see and apply.</p>
              </div>
              <select className="ga-input wo-select" value={statusSel} disabled={!row || busy === "status"} onChange={(e) => setStatus(e.target.value)} aria-label="Campaign status">
                {STATUS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            {autoOff && (
              <p className="wo-alert">
                <span>⏸</span>
                <span>
                  <b>Automatic messages are OFF</b>(
                  <Link href="/admin/settings/auto-messages">Settings › Auto messages</Link>) — changing a step does not message the creator. Send by hand with WhatsApp to selected.
                </span>
              </p>
            )}
            <div className="wo-chan">
              {[
                ["wa", "💬", "WhatsApp"],
                ["mail", "✉️", "Email"],
              ].map(([k, ic, label]) => (
                <div key={k} className="wo-ch">
                  <button type="button" className={`ga-toggle wo-tg ${chan[k].on ? "is-on" : ""}`} disabled={busy === k || msg.loading} onClick={() => toggle(k, label)} aria-pressed={chan[k].on} aria-label={`${label} messages for this campaign`} />
                  <div>
                    <p className="wo-ch__t">
                      {ic} {label}
                    </p>
                    <p className="wo-ch__s">{msg.loading ? "Loading…" : chanSub(chan[k])}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="ga-card wo-card">
            <div className="wo-dhead">
              <div>
                <h2 className="ga-h2">Campaign details</h2>
                <p className="wo-sub">Everything creators see in the brief.</p>
              </div>
              <Link href={`/admin/campaigns/${c.id}/contract`} className="wo-edit">
                ✏️ Edit
              </Link>
            </div>
            <div className="wo-details">
              {loading && <p className="wo-sub">Loading campaign…</p>}
              {DETAILS.map(([k, v]) => (
                <div key={k} className="wo-d">
                  <p>{k}</p>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="wo-col">
          <section className="ga-card wo-card">
            <h2 className="ga-h2">Campaign tools</h2>
            <div className="wo-tools">
              {TOOLS.map((t) => (
                <Link key={t.t} href={t.href} className={`wo-tool ${t.short ? "wo-tool--s" : ""}`}>
                  {t.ic} {t.t}
                </Link>
              ))}
            </div>
            <button type="button" className="wo-del" onClick={() => (setConfirm(""), setNote(""), setDelErr(""), setAsk(true))}>
              🗑 Delete campaign
            </button>
          </section>

          <section className="ga-card wo-card">
            <h2 className="ga-h2">Creator journey</h2>
            <div className="wo-journey">
              <Link href={`/admin/campaigns/${c.id}/creators`}>
                <strong>{jn(total)}</strong>
                <span>Total</span>
              </Link>
              <Link href={`/admin/campaigns/${c.id}/creators`}>
                <strong>{jn(approved)}</strong>
                <span>Approved</span>
              </Link>
              <Link href={`/admin/campaigns/${c.id}/content`}>
                <strong>{jn(done)}</strong>
                <span>Done</span>
                <small>every post up</small>
              </Link>
            </div>
          </section>
        </div>
      </div>

      {ask && (
        <div className="ga-overlay" onClick={() => setAsk(false)}>
          <div className="ga-modal wo-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete campaign">
            <h2 className="ga-h2">Delete “{c.name}”?</h2>
            <p>
              This permanently removes <b>{c.name}</b> and everything in it — creators in the campaign, contracts, addresses, shipments, videos, posts, invites and unsent WhatsApp / email messages. Creator, brand and agency accounts are not touched. <b>It can’t be undone.</b>
            </p>
            <label className="ga-label wo-lbl" htmlFor="wo-confirm">
              Type the campaign name to confirm
            </label>
            <input id="wo-confirm" className="ga-input" autoComplete="off" placeholder={c.name} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <label className="ga-label wo-lbl" htmlFor="wo-note">
              Note (optional)
            </label>
            <input id="wo-note" className="ga-input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            {delErr && <p className="wo-err">{delErr}</p>}
            <div className="wo-modal__act">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setAsk(false)}>
                Cancel
              </button>
              <button type="button" className="ga-btn ga-btn--danger" disabled={busy === "del"} onClick={del}>
                {busy === "del" ? "Deleting…" : "🗑 Delete campaign permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="ga-toast">{toast}</div>}

      <style>{`
        .wo-grid { display: grid; grid-template-columns: minmax(0, 652fr) minmax(0, 450fr); gap: 20px; align-items: start; }
        .wo-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .wo-card { padding: 22px 22px 22px; }
        .wo-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .wo-status { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .wo-select { width: 319px; height: 45px; padding: 0 32px 0 12px; font-size: 14px; color: #293652; appearance: none; background: #fff; }
        .wo-alert { display: flex; gap: 8px; margin-top: 18px; padding: 13px 16px 12px; border-radius: 12px; background: #ffeef0; border: 1px solid #f7cdd4; font-size: 12px; line-height: 1.33; color: #b64455; }
        .wo-alert b { font-weight: 700; }
        .wo-alert a { text-decoration: none; color: inherit; }
        .wo-alert a:hover { text-decoration: underline; }
        .wo-chan { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
        .wo-ch { display: flex; align-items: center; gap: 12px; padding: 18px 15px 16px; border-radius: 14px; background: var(--ad-soft-2); }
        .wo-tg { width: 38px; height: 22px; }
        .wo-tg:not(.is-on) { background: #dfe2ec; }
        .wo-tg:not(.is-on)::after { box-shadow: none; background: #dfe2ec; }
        .wo-ch__t { font-family: var(--ad-head); font-size: 23px; font-weight: 800; letter-spacing: -0.6px; line-height: 1.1; color: var(--ad-ink); }
        .wo-ch__s { margin-top: 6px; font-size: 12px; color: var(--ad-muted); }

        .wo-dhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .wo-edit { margin-top: 12px; margin-right: 6px; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wo-details { display: grid; grid-template-columns: 1fr 1fr; gap: 13px 12px; margin-top: 24px; }
        .wo-d { min-height: 78px; padding: 20px 19px 18px; border-radius: 14px; border: 1px solid var(--ad-line); }
        .wo-d:nth-child(n+5) { min-height: 96px; }
        .wo-d p { font-size: 11px; letter-spacing: .8px; text-transform: uppercase; color: var(--ad-muted); }
        .wo-d b { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; line-height: 1.33; color: var(--ad-ink); }

        .wo-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 10px; margin-top: 18px; }
        .wo-tool { display: grid; place-items: center; min-height: 59px; padding: 8px 18px; border-radius: 12px; border: 1px solid var(--ad-line-2); text-align: center; font-size: 14px; font-weight: 800; line-height: 1.33; color: var(--ad-primary-ink); transition: border-color .15s, background .15s; }
        .wo-tool--s { min-height: 41px; }
        .wo-tool:hover { border-color: var(--ad-primary); background: var(--ad-soft-2); }
        .wo-del { margin: 20px 0 6px 8px; padding: 0; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .wo-del:hover { color: var(--ad-red); }

        .wo-journey { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; margin: 20px 0 22px; }
        .wo-journey a { display: flex; flex-direction: column; min-height: 120px; padding: 25px 19px 16px; border-radius: 14px; border: 1px solid var(--ad-line); transition: border-color .15s; }
        .wo-journey a:hover { border-color: #cfd2ee; }
        .wo-journey strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; color: var(--ad-ink); }
        .wo-journey span { margin-top: 13px; font-size: 12px; color: var(--ad-muted); }
        .wo-journey small { margin-top: 7px; font-size: 11px; color: var(--ad-faint); }

        .wo-modal { padding: 24px; }
        .wo-modal p { margin-top: 10px; font-size: 13px; line-height: 1.5; color: var(--ad-muted); }
        .wo-lbl { margin-top: 14px; }
        .wo-err { margin-top: 10px !important; color: var(--ad-red) !important; font-weight: 700; }
        .wo-modal__act { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }

        @media (max-width: 1180px) { .wo-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .wo-card { padding: 18px 16px; }
          .wo-status { flex-direction: column; }
          .wo-select { width: 100%; }
          .wo-chan, .wo-details { grid-template-columns: 1fr; }
          .wo-d, .wo-d:nth-child(n+5) { min-height: 0; padding: 14px 16px; }
          .wo-ch__t { font-size: 20px; }
          .wo-journey { gap: 8px; }
          .wo-journey a { min-height: 0; padding: 16px 12px; }
          .wo-journey strong { font-size: 24px; }
          .wo-modal__act > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
