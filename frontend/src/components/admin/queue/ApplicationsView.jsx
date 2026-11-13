"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import Drawer from "@/components/admin/queue/Drawer";
import DecisionPanel from "@/components/admin/queue/DecisionPanel";
import { useRpc } from "@/lib/supabase";
import { act, errText, useToast, useReason, grp, dayAgo, short, typeLabel, campId, STAGE_LABEL, StateBox } from "@/components/admin/queue/live";

const STATUS_LABEL = { pending: "Pending", approved: "Approved", declined: "Declined", all: "All applications" };

/* org_applicants (naya pipeline) + admin_applications (purani marketplace) → ek jaisi rows */
function toRows(pipe = [], legacy = []) {
  const a = (Array.isArray(pipe) ? pipe : []).map((p) => {
    const c = p.creator || {};
    return {
      key: p.participation_id,
      pid: p.participation_id,
      name: c.name || (c.username ? "@" + c.username : "Creator"),
      handle: c.username ? "@" + c.username : p.applied_profile ? "@" + p.applied_profile : "—",
      campaign: p.campaign_name || "—",
      cid: campId(p),
      ctype: p.campaign_type,
      type: typeLabel(p.campaign_type),
      followers: c.followers != null ? short(c.followers) : "—",
      appliedAt: p.applied_at,
      fit: c.profile_pct >= 100 && c.followers ? "Good fit" : "Check",
      g: grp(p.stage),
      stage: p.stage,
      reason: p.reason,
      memberId: c.member_id,
      raw: p,
    };
  });
  const L = (Array.isArray(legacy) ? legacy : []).map((x) => ({
    key: "m-" + x.id,
    legacyId: x.id,
    name: x.creator_name || "Creator",
    handle: x.creator_org || "Marketplace",
    campaign: x.campaign_name || "—",
    cid: x.campaign_id,
    ctype: "",
    type: "—",
    followers: "—",
    appliedAt: x.created_at,
    fit: "Check",
    g: x.status === "Applied" ? "pending" : x.status === "Declined" ? "declined" : "approved",
    stage: x.status,
    reason: [x.decline_reason_code, x.decline_note].filter(Boolean).join(" — "),
    raw: x,
  }));
  return [...a, ...L];
}
// Har type apne tab mein — "Barter + Paid" alag tab (Paid / Barter mein dobara nahi aata)
const TYPE_KEY = { Paid: "paid", Barter: "barter", "Barter + Paid": "barter_paid" };
const typePass = (r, t) => t === "All" || r.ctype === TYPE_KEY[t];

/**
 * Applications (Figma 006) + creator review drawer (Figma 005) jab openId ho.
 * Purane Super Admin → Applications jaisa: api.org_applicants + admin_applications, har 30 sec.
 * Upar ke number filter bhi hain (#pending / #approved / #declined / #all).
 */
export default function ApplicationsView({ openId }) {
  const router = useRouter();
  const pr = useRpc("admin", "api.org_applicants", { p_campaign: null, p_stage: null }, { refreshMs: 30000 });
  const ar = useRpc("admin", "admin_applications", { p_campaign: null, p_status: null }, { refreshMs: 30000 });
  const [type, setType] = useState("All");
  const [camp, setCamp] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState("");
  const [toastNode, toast] = useToast();
  const [reasonNode, ask] = useReason();

  // #approved jaisa hash = status filter
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace("#", "");
      if (STATUS_LABEL[h]) setStatus(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const all = useMemo(() => toRows(pr.data, ar.data), [pr.data, ar.data]);
  const campaigns = useMemo(() => [...new Set(all.map((r) => r.campaign))].sort((a, b) => a.localeCompare(b)), [all]);
  const t = q.trim().toLowerCase();
  const base = all.filter((r) => typePass(r, type) && (!camp || r.campaign === camp) && (!t || [r.name, r.handle, r.campaign].join(" ").toLowerCase().includes(t)));
  const cnt = (g) => base.filter((r) => r.g === g).length;
  const rows = base.filter((r) => status === "all" || r.g === status);
  const typeN = (k) => all.filter((r) => typePass(r, k) && (!camp || r.campaign === camp) && (status === "all" || r.g === status)).length;
  const reload = () => {
    pr.reload(true);
    ar.reload(true);
  };

  const approve = async (r, after) => {
    setBusy(r.key);
    const { error } = r.legacyId ? await act.approveLegacy(r.legacyId) : await act.approveApplicant(r.pid);
    setBusy("");
    if (error) return toast(errText(error), true);
    toast(`${r.name} approved for ${r.campaign}`);
    reload();
    after && after();
  };
  const decline = async (r, after) => {
    const pick = await ask("Why are you declining this creator?");
    if (!pick) return;
    setBusy(r.key);
    const { error } = r.legacyId ? await act.declineLegacy(r.legacyId, pick) : await act.declineApplicant(r.pid, pick);
    setBusy("");
    if (error) return toast(errText(error), true);
    toast(`${r.name} declined — message sent`);
    reload();
    after && after();
  };

  const csv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Creator", "Handle", "Campaign", "Type", "Followers", "Applied", "Status"].map(esc).join(",");
    const body = rows.map((a) => [a.name, a.handle, a.campaign, a.type, a.followers, dayAgo(a.appliedAt), STAGE_LABEL[a.stage] || a.stage].map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([head + "\n" + body], { type: "text/csv" }));
    const el = document.createElement("a");
    el.href = url;
    el.download = `${status}-applications.csv`;
    el.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const open = openId ? all.find((r) => r.key === decodeURIComponent(openId)) : null;
  const loading = pr.loading && !pr.data;

  return (
    <AdminShell>
      <PageHead title="Applications" sub="Every creator who applied, across all campaigns — decide in one place." />

      <Stats
        items={[
          { value: cnt("pending"), label: "Pending", note: "Waiting for you", href: "/vault/applications/screening" },
          { value: cnt("approved"), label: "Approved", note: "Selected creators", href: "#approved" },
          { value: cnt("declined"), label: "Declined", note: "Not selected", href: "#declined" },
          { value: base.length, label: "All applications", note: "Everything", href: "#all" },
        ]}
      />

      <section className="ga-card apl">
        <div className="apl-head">
          <h2 className="ga-h2">
            {STATUS_LABEL[status]} · {rows.length}
            {status !== "pending" && (
              <a href="#pending" className="apl-back">
                Show pending
              </a>
            )}
          </h2>
          <button type="button" className="apl-csv" onClick={csv} disabled={!rows.length}>
            ⬇️ CSV
          </button>
        </div>

        <div className="apl-filters">
          <div className="ga-tabs apl-tabs" role="tablist">
            {[
              ["All", "All"],
              ["Paid", `💰 Paid ${typeN("Paid")}`],
              ["Barter", `🎁 Barter ${typeN("Barter")}`],
              ["Barter + Paid", `🎁💰 Barter + Paid ${typeN("Barter + Paid")}`],
            ].map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={type === k} className={`ga-tab ${type === k ? "is-on" : ""}`} onClick={() => setType(k)}>
                {label}
              </button>
            ))}
          </div>
          <select className="ga-input apl-select" value={camp} onChange={(e) => setCamp(e.target.value)} aria-label="Campaign">
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className="ga-input apl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator…" aria-label="Search creator" />
        </div>

        <div className="apl-wrap" data-scroll>
          <StateBox loading={loading} error={!pr.data && pr.error} onRetry={reload} />
          {!loading && !(!pr.data && pr.error) && (
            <table className="apl-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Campaign</th>
                  <th>Type</th>
                  <th>Followers</th>
                  <th>Applied</th>
                  <th>Fit</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.key} onClick={() => router.push(`/vault/applications/${encodeURIComponent(a.key)}`)}>
                    <td>
                      <Link href={`/vault/applications/${encodeURIComponent(a.key)}`} className="apl-name" onClick={(e) => e.stopPropagation()}>
                        {a.name}
                      </Link>
                      <span className="apl-handle">{a.handle}</span>
                    </td>
                    <td>{a.campaign}</td>
                    <td>{a.type !== "—" ? <span className={`ga-badge ga-badge--${a.ctype === "barter" ? "orange" : "violet"}`}>{a.type}</span> : "—"}</td>
                    <td>{a.followers}</td>
                    <td>{dayAgo(a.appliedAt)}</td>
                    <td>
                      <span className={`ga-badge ga-badge--${a.fit === "Good fit" ? "green" : "orange"}`}>{a.fit}</span>
                    </td>
                    <td className="apl-act" onClick={(e) => e.stopPropagation()}>
                      {a.g === "pending" ? (
                        <>
                          <button type="button" className="apl-decline" disabled={busy === a.key} onClick={() => decline(a)}>
                            Decline
                          </button>
                          <button type="button" className="ga-btn ga-btn--primary apl-approve" disabled={busy === a.key} onClick={() => approve(a)}>
                            {busy === a.key ? "…" : "Approve"}
                          </button>
                        </>
                      ) : (
                        <span className={`ga-badge ga-badge--${a.g === "approved" ? "green" : "red"}`}>{STAGE_LABEL[a.stage] || a.stage}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && pr.data && !rows.length && <p className="apl-empty">{all.length ? "No applications match these filters." : "No applications yet."}</p>}
        </div>
      </section>

      {open && (
        <Drawer eyebrow="Decision workspace" title={`Screen ${open.name} for ${open.campaign}`} closeHref="/vault/applications">
          <DecisionPanel
            meta={[open.campaign, open.type !== "—" ? open.type : "", `Applied ${dayAgo(open.appliedAt).toLowerCase()}`, open.followers !== "—" ? `${open.followers} followers` : ""].filter(Boolean).join(" · ")}
            badges={[
              { label: open.fit, tone: open.fit === "Good fit" ? "green" : "orange" },
              { label: "Applications", tone: "violet" },
            ]}
            why={
              open.g === "pending"
                ? `${open.name} (${open.handle}) is waiting for a decision. Review campaign brief and evidence before making a decision.`
                : `${open.name} — ${STAGE_LABEL[open.stage] || open.stage}${open.reason ? `: ${open.reason}` : ""}.`
            }
            actions={
              open.g !== "pending" ? (
                <>
                  <span className={`ga-badge ga-badge--${open.g === "approved" ? "green" : "red"} apl-state`}>{open.g === "approved" ? "✓ Approved" : "Declined"}</span>
                  {open.cid && (
                    <Link href={`/vault/campaigns/${open.cid}/creators`} className="ga-btn ga-btn--ghost">
                      Open campaign
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="ga-btn ga-btn--primary" disabled={busy === open.key} onClick={() => approve(open, () => router.push("/vault/applications"))}>
                    {busy === open.key ? "…" : "Approve"}
                  </button>
                  <button type="button" className="ga-btn ga-btn--ghost" disabled={busy === open.key} onClick={() => decline(open, () => router.push("/vault/applications"))}>
                    Decline
                  </button>
                  {open.memberId && (
                    <Link href={`/vault/creators/${open.memberId}/profile`} className="ga-btn ga-btn--ghost">
                      View 360°
                    </Link>
                  )}
                  {open.cid && (
                    <Link href={`/vault/campaigns/${open.cid}/overview`} className="ga-btn ga-btn--ghost">
                      Open campaign
                    </Link>
                  )}
                </>
              )
            }
          />
        </Drawer>
      )}
      {openId && !open && !loading && (
        <Drawer eyebrow="Decision workspace" title="Application not found" closeHref="/vault/applications">
          <p className="apl-empty">This application isn’t in the list any more.</p>
        </Drawer>
      )}

      {reasonNode}
      {toastNode}

      <style>{`
        .apl { padding: 22px 22px 22px; }
        .apl-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 7px; }
        .apl-csv { margin-right: 8px; border: 0; background: none; padding: 0; font-size: 14px; font-weight: 800; color: #6657e9; }
        .apl-csv:hover { color: var(--ad-primary-2); }
        .apl-csv:disabled { opacity: .45; }
        .apl-back { margin-left: 10px; font-family: var(--ad-sans); font-size: 12.5px; font-weight: 800; color: #6657e9; letter-spacing: 0; }
        .apl-decline:disabled, .apl-approve:disabled { opacity: .5; }
        .apl-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 26px; }
        .apl-tabs .ga-tab { height: 37px; }
        .apl-tabs .ga-tab:not(.is-on) { color: #67718a; }
        .apl-select { width: 233px; height: 44px; margin-left: 4px; padding-right: 30px; appearance: none; color: var(--ad-text); background: #fff; }
        .apl-search { width: 270px; height: 44px; }
        .apl-search::placeholder { color: #757575; }

        .apl-wrap { margin-top: 31px; overflow-x: auto; }
        .apl-table { width: 100%; min-width: 960px; border-collapse: collapse; font-size: 13px; }
        .apl-table th { padding: 0 11px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #9aa2b4; border-bottom: 1px solid var(--ad-line); white-space: nowrap; }
        .apl-table td { height: 70px; padding: 0 11px; border-bottom: 1px solid var(--ad-line); color: var(--ad-ink); white-space: nowrap; }
        .apl-table tbody tr:last-child td { border-bottom: 0; }
        .apl-table tbody tr { cursor: pointer; transition: background .15s; }
        .apl-table tbody tr:hover { background: var(--ad-soft-2); }
        .apl-table th:nth-child(1) { width: 145px; }
        .apl-table th:nth-child(2) { width: auto; }
        /* campaign ka naam lamba ho to do line mein — Approve button kabhi na kate */
        .apl-table td:nth-child(2) { white-space: normal; min-width: 160px; line-height: 1.35; }
        .apl-table th:nth-child(3) { width: 102px; }
        .apl-table th:nth-child(4) { width: 124px; }
        .apl-table th:nth-child(5) { width: 109px; }
        .apl-table th:nth-child(6) { width: 112px; }
        .apl-name { display: block; font-size: 13px; font-weight: 800; color: var(--ad-ink); }
        .apl-name:hover { color: var(--ad-primary); }
        .apl-handle { display: block; margin-top: 6px; font-size: 11px; font-weight: 500; color: #9aa1b3; }
        .apl-act { text-align: left; }
        .apl-decline { border: 0; background: none; padding: 0 10px 0 0; font-size: 13px; font-weight: 800; color: #6657e9; }
        .apl-decline:hover { color: var(--ad-red); }
        .apl-approve { height: 40px; padding: 0 16px; font-size: 13px; box-shadow: none; margin-left: 2px; }
        .apl-empty { padding: 30px 0 10px; text-align: center; font-size: 13px; color: var(--ad-muted); }
        .apl-state { height: 40px; padding: 0 14px; font-size: 13px; }

        @media (max-width: 1023px) {
          .apl-select, .apl-search { flex: 1 1 200px; width: auto; margin-left: 0; }
        }
        @media (max-width: 640px) {
          .apl { padding: 18px 16px; }
          .apl-filters { gap: 8px; }
          .apl-tabs { width: 100%; }
          .apl-select, .apl-search { flex: 1 1 100%; }
          .apl-wrap { margin: 16px -16px 0; padding: 0 16px; }
        }
      `}</style>
    </AdminShell>
  );
}
