"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { REPORT_TABS, LinkTabs, Panel, Table, downloadFile, toCsv, useToast, fmtNum, fmtMoney, emptyState } from "@/components/admin/settings/kit";
import { sbFor, rpc, useRpc, errText } from "@/lib/supabase";
import { traitCsvRows } from "@/components/admin/settings/traits";

/* purane app jaise funnel ke stage */
const PENDING = ["applied", "eligible", "sent_to_brand"];
const DECLINED = ["ineligible", "brand_declined", "dropped", "rejected"];
const APPROVED = (s) => !PENDING.includes(s) && !DECLINED.includes(s);
const ACTIVE = ["Live", "Shortlist completed", "In Production", "Sourcing", "Approval"];
const HEAD = ["Campaign", "Status", "Applied", "Pending", "Approved", "Declined", "Posts", "Reach", "Views", "Likes", "Comments"];
const statusTxt = (s) => {
  const t = String(s || "").replace(/_/g, " ");
  return t ? t[0].toUpperCase() + t.slice(1) : "—";
};
const toneOf = (s) => (/live|active|running/i.test(s || "") ? "green" : /complet|done|closed/i.test(s || "") ? "" : "violet");
const sum = (o, pred) => Object.entries(o || {}).reduce((a, [k, v]) => a + (pred(k) ? Number(v) || 0 : 0), 0);

/**
 * /admin/reports — purane app ka Reports (Super Admin = saare campaigns):
 *  upar ke 4 = loadKPIs (creators / campaigns / barter_items / story_deals tables + api.workspace_live)
 *  campaign table = api.org_reports · All creators CSV = api.creator_trait_rows
 */
export default function ReportsPage() {
  const rep = useRpc("admin", "api.org_reports");
  const [kpi, setKpi] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, say] = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = sbFor("admin");
      const [creators, campaigns, barter, stories] = await Promise.all([
        sb.from("creators").select("rating"),
        sb.from("campaigns").select("status,brand"),
        sb.from("barter_items").select("stage,value,reach"),
        sb.from("story_deals").select("stage,value"),
      ]);
      const C = creators.data || [];
      const CA = campaigns.data || [];
      const B = barter.data || [];
      const ST = stories.data || [];
      const v = {
        creators: C.length,
        active: CA.filter((c) => ACTIVE.includes(c.status)).length,
        barters: B.filter((b) => b.stage !== "Completed").length,
        emv: B.reduce((a, b) => a + (Number(b.value) || 0), 0) + ST.reduce((a, d) => a + (Number(d.value) || 0), 0),
      };
      const { data: wl } = await rpc("admin", "api.workspace_live");
      if (wl) {
        if (wl.creators && wl.creators.roster != null) v.creators = wl.creators.roster;
        if (wl.campaigns && wl.campaigns.barter_live != null) v.barters = wl.campaigns.barter_live;
      }
      if (alive) setKpi(v);
    })().catch(() => alive && setKpi({}));
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(
    () =>
      (Array.isArray(rep.data) ? rep.data : []).map((c) => {
        const f = c.funnel || {};
        const m = c.metrics || {};
        return {
          c,
          applied: sum(f, () => true),
          approved: sum(f, APPROVED),
          declined: sum(f, (k) => DECLINED.includes(k)),
          pending: sum(f, (k) => PENDING.includes(k)),
          posts: Number(c.posts) || 0,
          reach: Number(m.reach) || 0,
          views: Number(m.views) || 0,
          likes: Number(m.likes) || 0,
          comments: Number(m.comments) || 0,
          saves: Number(m.saves) || 0,
        };
      }),
    [rep.data]
  );
  const T = (k) => rows.reduce((a, r) => a + r[k], 0);
  const eng = T("reach") ? (((T("likes") + T("comments") + T("saves")) / T("reach")) * 100).toFixed(1) + "% eng. / reach" : "";
  const L = (n, f = fmtNum) => (rep.loading ? "…" : f(n));
  const K = (k, f = fmtNum) => (kpi ? (kpi[k] == null ? "—" : f(kpi[k])) : "…");
  const TOP = [
    { n: K("creators"), l: "Creators" },
    { n: K("active"), l: "Active campaigns" },
    { n: K("barters"), l: "Live barters" },
    { n: K("emv", fmtMoney), l: "EMV generated" },
  ];
  const MID = [
    { n: L(T("applied")), l: "Applications" },
    { n: L(T("approved")), l: "Approved" },
    { n: L(T("posts")), l: "Posts live" },
    { n: L(T("reach")), l: "Reach" },
    { n: L(T("views")), l: "Views", s: eng },
  ];

  const csv = () => {
    if (!rows.length) return say("No campaigns to download yet.", true);
    downloadFile(
      "campaign-report.csv",
      toCsv(
        ["Campaign", "Brand", "Status", "Type", "Applied", "Pending", "Approved", "Declined", "Posts", "Reach", "Views", "Likes", "Comments", "Saves"],
        rows.map((r) => [r.c.name, r.c.brand || "", r.c.lifecycle_status || "", r.c.comp_type || "", r.applied, r.pending, r.approved, r.declined, r.posts, r.reach, r.views, r.likes, r.comments, r.saves])
      )
    );
    say("Campaign report downloaded");
  };
  const creatorsCsv = async () => {
    setBusy(true);
    const { data, error } = await rpc("admin", "api.creator_trait_rows", { p_campaign: null, p_brand: null, p_only: null });
    setBusy(false);
    if (error) return say(errText(error), true);
    const [head, ...body] = traitCsvRows(data?.rows || []);
    if (!body.length) return say("No creators yet.", true);
    downloadFile("creators-all.csv", toCsv(head, body));
    say("All creators CSV downloaded");
  };

  return (
    <AdminShell>
      <PageHead title="Reports" sub="Live campaign performance across Geek OS.">
        <button type="button" className="rp-dl" onClick={csv}>
          ⬇️ Download CSV
        </button>
        <button type="button" className="rp-dl" onClick={creatorsCsv} disabled={busy}>
          {busy ? "Preparing…" : "⬇️ All creators CSV"}
        </button>
      </PageHead>
      <LinkTabs tabs={REPORT_TABS} />

      <div className="rp-top">
        {TOP.map((s, i) => (
          <div key={s.l} className={`rp-stat ${i === 0 ? "rp-stat--hero" : ""}`}>
            <strong>{s.n}</strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>
      <div className="rp-mid">
        {MID.map((s) => (
          <div key={s.l} className="rp-stat rp-stat--tall">
            <strong>{s.n}</strong>
            <span>{s.l}</span>
            {s.s && <small>{s.s}</small>}
          </div>
        ))}
      </div>

      <Panel title="Campaign performance" sub={rep.loading ? "…" : `${rows.length} campaign${rows.length === 1 ? "" : "s"}`} className="rp-panel">
        <Table
          rowH={57}
          minW={980}
          cols={[{ w: 216 }, { w: 125 }, { w: 81 }, { w: 85 }, { w: 98 }, { w: 92 }, { w: 69 }, { w: 71 }, { w: 73 }, { w: 63 }, { w: 103 }].map((c, i) => ({ ...c, label: HEAD[i] }))}
          empty={emptyState({ loading: rep.loading, error: rep.error, reload: rep.reload, empty: "No campaigns yet — launch one to see performance here." })}
          rows={rows.map((r) => [
            <span key="n" title={[r.c.brand, r.c.creators_needed ? `need ${r.c.creators_needed}` : ""].filter(Boolean).join(" · ")}>
              {r.c.name}
              {r.c.brand ? ` · ${r.c.brand}` : ""}
            </span>,
            <span key="s" className={`ga-badge ga-badge--${toneOf(r.c.lifecycle_status)}`}>
              {statusTxt(r.c.lifecycle_status)}
            </span>,
            r.applied,
            r.pending,
            r.approved,
            r.declined,
            r.posts,
            r.reach ? fmtNum(r.reach) : "—",
            r.views ? fmtNum(r.views) : "—",
            r.likes ? fmtNum(r.likes) : "—",
            r.comments ? fmtNum(r.comments) : "—",
          ])}
        />
      </Panel>
      {toast}

      <style>{`
        .rp-dl { height: 36px; padding: 0 8px; border: 0; background: none; font-size: 14px; font-weight: 800; color: #6657e9; }
        .rp-dl:hover { color: var(--ad-primary-2); }
        .rp-top { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; margin-bottom: 23px; }
        .rp-mid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 13px; margin-bottom: 23px; }
        .rp-stat { display: flex; flex-direction: column; min-height: 106px; padding: 23px 19px 16px; border-radius: 18px; background: #fff; border: 1px solid var(--ad-line); box-shadow: 0 8px 24px rgba(30,37,73,.02); }
        .rp-stat--tall { min-height: 120px; }
        .rp-stat strong { font-family: var(--ad-head); font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 1.15; color: var(--ad-ink); }
        .rp-stat span { margin-top: 12px; font-size: 12px; color: var(--ad-muted); }
        .rp-stat small { margin-top: 7px; font-size: 11px; color: var(--ad-faint); }
        .rp-stat--hero { background: var(--ad-grad); border-color: transparent; box-shadow: 0 8px 24px rgba(30,37,73,.02); }
        .rp-stat--hero strong { color: #fff; }
        .rp-stat--hero span { color: #e4ddff; }
        .rp-panel { padding-bottom: 22px; }
        .rp-panel .sk-tw { margin-top: 12px; }
        @media (max-width: 1180px) { .rp-mid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 820px) { .rp-top { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .rp-top, .rp-mid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
          .rp-mid .rp-stat:last-child { grid-column: 1 / -1; }
          .rp-stat, .rp-stat--tall { min-height: 0; padding: 16px 14px; }
          .rp-stat strong { font-size: 24px; }
          .rp-dl { padding: 0; justify-content: flex-start; text-align: left; }
        }
      `}</style>
    </AdminShell>
  );
}
