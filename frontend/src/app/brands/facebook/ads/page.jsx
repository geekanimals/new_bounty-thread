"use client";

import { useCallback, useEffect, useState } from "react";
import BrandShell, { ToneIcon } from "@/components/brands/BrandShell";
import FacebookTabs, { FbGate } from "@/components/brands/FacebookTabs";
import { BrLoading, BrError, BrEmpty, useToast } from "@/components/brands/BrandStates";
import { useFbPages, fbAdAccounts, fbAdCampaigns, fbAdStatus, getFbActId, setFbActId, FB_ACT_STATUS, bShort, bNum } from "@/services/brand";
import { AlertTriangle, Pause, Play, ChevronDown } from "@/components/ui/Icons";

/** /brands/facebook/ads — Meta ad campaigns: spend, results, pause / resume (purana fbAds: ad_accounts → ad_campaigns 30 din → ad_status) */
export default function FacebookAds() {
  const fb = useFbPages();
  return (
    <BrandShell>
      <title>Facebook ads — Geek OS Brand</title>
      <FacebookTabs fb={fb} />
      <FbGate fb={fb}>{() => <AdsPane can={fb.can} />}</FbGate>

      <style>{`
        .fa-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        .fa-warn {
          display: flex; align-items: flex-start; gap: 10px; margin: 18px 0; padding: 12px 16px; border-radius: 12px;
          background: var(--br-orange-bg); color: #b45f05; font-size: 13px; line-height: 1.5;
        }
        .fa-warn svg { flex-shrink: 0; margin-top: 1px; }
        .fa-table td b { font-weight: 800; }
        .fa-name { display: block; font-size: 13px; font-weight: 700; }
        .fa-st { display: block; margin-top: 2px; font-size: 11.5px; color: var(--br-muted); }
        .fa-st.is-on { color: var(--br-green); }
        .fa-table tr.is-off td { background: #fafafd; }
        .fa-btn { min-width: 92px; }
        .fa-more { padding: 6px 0 16px; }
        .fa-more span { font-size: 12.5px; color: var(--br-faint); }

        @media (max-width: 1100px) {
          .fa-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .fa-stats { gap: 10px; }
          .fa-warn { font-size: 12.5px; }
        }
              .fa-none { padding: 18px !important; text-align: center; color: var(--br-muted); font-size: 13px; }
        .fa-act { border: 0; background: transparent; font: inherit; font-weight: 700; color: inherit; max-width: 220px; }
        .br-toggle:disabled { opacity: .5; cursor: default; }
`}</style>
    </BrandShell>
  );
}

const resLabel = (L) =>
  (L || []).map((x) => `${bNum(x.value)} ${String(x.type).replace(/^offsite_conversion\.fb_pixel_|^onsite_conversion\.|omni_/, "").replace(/_/g, " ")}`).join(", ");

function AdsPane({ can }) {
  const [acc, setAcc] = useState({ list: [], loading: true, error: null });
  const [act, setAct] = useState(null);
  const [camp, setCamp] = useState({ data: null, loading: false, error: null });
  const [shown, setShown] = useState(4);
  const [busy, setBusy] = useState("");
  const [toast, say] = useToast();

  useEffect(() => {
    let on = true;
    fbAdAccounts().then((r) => {
      if (!on) return;
      const L = (r.data && r.data.accounts) || [];
      setAcc({ list: L, loading: false, error: r.error });
      const saved = getFbActId();
      setAct((L.find((a) => a.id === saved) || L[0] || {}).id || null);
    });
    return () => {
      on = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!act) return;
    setCamp((c) => ({ ...c, loading: true }));
    const r = await fbAdCampaigns(act, 30);
    setCamp({ data: r.data, loading: false, error: r.error });
  }, [act]);
  useEffect(() => {
    load();
  }, [load]);

  if (acc.loading) return <BrLoading rows={4} />;
  if (acc.error) return <BrError error={acc.error.message} />;
  if (!acc.list.length) return <BrEmpty title="No ad accounts shared" text="Reconnect Facebook and tick your ad account on Facebook’s screen." />;

  const a = acc.list.find((x) => x.id === act) || acc.list[0];
  const cur = a.currency || "INR";
  const money = (x) => (x == null || x === "" ? "—" : `${cur === "INR" ? "₹" : cur + " "}${bNum(Math.round(Number(x) * 100) / 100)}`);
  const t = (camp.data && camp.data.totals) || {};
  const rows = (camp.data && camp.data.campaigns) || [];
  const STATS = [
    { label: "Spent", value: money(t.spend), note: `last 30 days · ${rows.length} campaigns`, icon: "wallet", dark: true },
    { label: "Impressions", value: bShort(t.impressions), note: `${bShort(t.reach)} reach`, icon: "eye" },
    { label: "Link clicks", value: bShort(t.clicks), note: t.ctr != null ? `CTR ${Math.round(Number(t.ctr) * 100) / 100}%` : "", icon: "link" },
    { label: "Cost per click", value: money(t.cpc), note: t.cpm != null ? `${money(t.cpm)} per 1,000 views` : "", icon: "package" },
  ];

  // pause / resume (purana data-fbcs + confirm)
  const flip = async (c) => {
    const to = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    if (!window.confirm(to === "PAUSED" ? "Pause this campaign? Ads stop showing right away." : "Resume this campaign? Ads start spending again.")) return;
    setBusy(c.id);
    const r = await fbAdStatus(c.id, to);
    setBusy("");
    say(r.error ? r.error.message : to === "PAUSED" ? "⏸ Campaign paused" : "▶ Campaign resumed");
    if (!r.error) load();
  };

  return (
    <>
      <div className="fa-stats">
        {STATS.map((st, i) => (
          <div key={st.label} className={`br-stat ${st.dark ? "br-stat--dark" : ""}`}>
            <p className="br-stat__label">
              <ToneIcon icon={st.icon} tone={st.dark ? "dark" : ["violet", "blue", "green"][i - 1]} size={30} />
              {st.label}
            </p>
            <p className="br-stat__value">{st.value}</p>
            {st.note && <p className="br-stat__note">{st.note}</p>}
          </div>
        ))}
      </div>

      <p className="fa-warn">
        <AlertTriangle size={15} />
        <span>
          {acc.list.length > 1 ? (
            <select
              className="fa-act"
              aria-label="Ad account"
              value={a.id}
              onChange={(e) => {
                setAct(e.target.value);
                setFbActId(e.target.value);
              }}
            >
              {acc.list.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name || x.id}
                </option>
              ))}
            </select>
          ) : (
            <b>{a.name || a.id}</b>
          )}{" "}
          ({FB_ACT_STATUS[a.status] || `Status ${a.status}`}). Pause and Resume change the campaign on Meta Ads right away. Budgets and new ads are edited in Meta Ads Manager.
        </span>
      </p>

      {camp.loading && !camp.data ? (
        <BrLoading rows={4} />
      ) : camp.error ? (
        <BrError error={camp.error.message} onRetry={load} />
      ) : (
        <div className="br-table-wrap">
          <table className="br-table fa-table">
            <thead>
              <tr>
                <th>Ad campaign</th>
                <th>On</th>
                <th>Budget / day</th>
                <th>Spent</th>
                <th>Results</th>
                <th>Cost each</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, shown).map((r) => {
                const on = r.status === "ACTIVE";
                const canFlip = can && (r.status === "ACTIVE" || r.status === "PAUSED");
                return (
                  <tr key={r.id} className={on ? "" : "is-off"}>
                    <td>
                      <strong className="fa-name">{r.name}</strong>
                      <small className={`fa-st ${r.effective_status === "ACTIVE" ? "is-on" : ""}`}>
                        {String(r.effective_status || r.status || "").replace(/_/g, " ").toLowerCase()}
                        {r.objective ? ` · ${String(r.objective).replace(/^OUTCOME_/, "").replace(/_/g, " ").toLowerCase()}` : ""}
                      </small>
                    </td>
                    <td>
                      <button type="button" className={`br-toggle ${on ? "is-on" : ""}`} role="switch" aria-checked={on} aria-label={`${r.name} on or off`} disabled={!canFlip || !!busy} onClick={() => flip(r)} />
                    </td>
                    <td>
                      <b>{r.daily_budget ? money(r.daily_budget) : r.lifetime_budget ? `${money(r.lifetime_budget)} total` : "—"}</b>
                    </td>
                    <td>{money(r.spend)}</td>
                    <td>
                      <b>{resLabel(r.results) || "—"}</b>
                    </td>
                    <td>{money(r.cpc)}</td>
                    <td>
                      {canFlip &&
                        (on ? (
                          <button type="button" className="br-btn br-btn--ghost br-btn--sm fa-btn" disabled={!!busy} onClick={() => flip(r)}>
                            <Pause size={12} /> {busy === r.id ? "…" : "Pause"}
                          </button>
                        ) : (
                          <button type="button" className="br-btn br-btn--primary br-btn--sm fa-btn" disabled={!!busy} onClick={() => flip(r)}>
                            <Play size={12} /> {busy === r.id ? "…" : "Resume"}
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="fa-none">
                    No campaigns in this ad account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="br-more fa-more">
            {shown < rows.length ? (
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setShown(shown + 4)}>
                Load more <ChevronDown size={14} />
              </button>
            ) : (
              <span>That’s all your ad campaigns in the last 30 days</span>
            )}
          </div>
        </div>
      )}
      {toast}
    </>
  );
}
