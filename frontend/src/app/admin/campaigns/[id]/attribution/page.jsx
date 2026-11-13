"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, Note, MiniStats, TextBtn, TableState, useToast, copyText, downloadFile, num, inr, ago } from "@/components/admin/campaign2/kit";
import TrackModal from "@/components/admin/campaign2/TrackModals";
import { useRpc, rpc, sbFor, errText } from "@/lib/supabase";
import { useCampaign } from "@/components/admin/campaign/live";

/*
 * 🔗 Links & codes — purane tracking.js jaisa.
 * Data: api.track_report · code badlo: track_link_set · campaign ka shop link: campaigns.tracking.dest_url (purane Edit campaign jaisa)
 * Popups: track_links_bulk / track_codes_bulk / track_sales_add (TrackModals.jsx).
 */
const SORTS = [
  ["clicks", "Most clicks"],
  ["orders", "Most orders"],
  ["copies", "Most code copies"],
  ["recent", "Last clicked"],
  ["name", "Name A → Z"],
];
const MODE = { none: "Link only", common: "One code for everyone", per_creator: "Code + link" };

export default function CampaignAttribution() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const { data, error, loading, reload } = useRpc("admin", "api.track_report", { p_campaign: id }, { skip: !id || id === "sample" });
  const camp = useCampaign(id);
  const [sort, setSort] = useState("clicks");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState("");
  const [modal, setModal] = useState(null);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const d = data || {};
  const cfg = d.config || {};
  const L = useMemo(() => d.links || [], [d.links]);
  const on = cfg.enabled === true || cfg.enabled === "true";
  const mode = cfg.mode || "none";
  const dest = cfg.dest_url || cfg.product_link || "";
  const linkOf = (slug) => `${origin}/go/${slug}`;

  const T = L.reduce(
    (a, x) => {
      a.clicks += +x.clicks || 0;
      a.unique += +x.unique || 0;
      a.copies += +x.copies || 0;
      a.shop += +x.shop || 0;
      a.orders += +x.orders || 0;
      a.sales += +x.sales || 0;
      if (+x.clicks > 0) a.active++;
      return a;
    },
    { clicks: 0, unique: 0, copies: 0, shop: 0, orders: 0, sales: 0, active: 0 }
  );
  const notSplit = (d.sales || []).filter((s) => !s.handle);
  const nsOrders = notSplit.reduce((a, s) => a + (+s.orders || 0), 0);
  const nsSales = notSplit.reduce((a, s) => a + (+s.amount || 0), 0);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return L.filter((x) => !t || [x.handle, x.name, x.code, x.slug, x.stage].join(" ").toLowerCase().includes(t)).sort((a, b) =>
      sort === "name"
        ? String(a.handle || "").localeCompare(String(b.handle || ""))
        : sort === "orders"
          ? (+b.orders || 0) - (+a.orders || 0) || (+b.sales || 0) - (+a.sales || 0)
          : sort === "copies"
            ? (+b.copies || 0) - (+a.copies || 0)
            : sort === "recent"
              ? new Date(b.last_click || 0) - new Date(a.last_click || 0)
              : (+b.clicks || 0) - (+a.clicks || 0)
    );
  }, [L, q, sort]);

  const copy = async (x) => {
    await copyText(linkOf(x.slug));
    show(`Copied ${linkOf(x.slug).replace(/^https?:\/\//, "")}`);
  };

  // creator ka code (purane inline code input jaisa — track_link_set)
  const setCode = async (x) => {
    if (!d.can_edit) return;
    const cur = x.own_code || "";
    const v0 = window.prompt(`Code for @${x.handle || x.slug} (blank = remove${mode === "common" ? ", uses the common code" : ""})`, cur);
    if (v0 == null) return;
    const v = v0.trim().toUpperCase().replace(/\s+/g, "");
    if (v === cur) return;
    if (v && !/^[A-Z0-9_-]{2,30}$/.test(v)) return show("A code is 2–30 letters / numbers, no spaces");
    if (v && L.some((l) => l.link_id !== x.link_id && l.own_code === v) && !window.confirm(`${v} is already another creator's code. Use it for both? (orders on it then can't be split by creator)`)) return;
    const { error: e } = await rpc("admin", "api.track_link_set", { p_link: x.link_id, p_code: v || null });
    show(e ? errText(e) : v ? `Code saved ✓ ${v}` : "Code removed");
    if (!e) reload(true);
  };

  // campaign ka shop link — purane "Edit campaign → Link & coupon tracking" jaisa campaigns.tracking mein
  const saveDest = async () => {
    const v = draft.trim();
    if (v && !/^https?:\/\//i.test(v)) return show("The shop link must start with https://");
    const tracking = { ...(camp.c?.tracking || {}), dest_url: v || null };
    const { error: e } = await sbFor("admin").from("campaigns").update({ tracking }).eq("id", id);
    if (e) return show(errText(e));
    setEdit(false);
    show("Shop link updated for every link ✓");
    camp.reload();
    reload(true);
  };

  const download = () => {
    downloadFile(`links-and-codes-${String(cfg.campaign || "campaign").replace(/[^\w]+/g, "-").toLowerCase()}.csv`, [
      ["Creator", "Name", "On Geek OS", "Stage", "Geek link", "Opens (brand link)", "Code", "Clicks", "Unique people", "Code copies", "Went to shop", "Orders", "Sales (INR)", "Last click"],
      ...L.map((x) => ["@" + (x.handle || ""), x.name || "", x.kind === "geek" ? "Yes" : "No", String(x.stage || "").replace(/_/g, " "), linkOf(x.slug), x.dest_url || dest, x.code || "", x.clicks, x.unique, x.copies, x.shop, x.orders, x.sales, x.last_click || ""]),
    ]);
    show("Links & codes downloaded");
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />

      <Panel
        title="🔗 Links & codes"
        sub="Every creator’s own link and code — clicks, code copies, orders, sales."
        actions={
          <>
            {d.can_edit && <TextBtn onClick={() => setModal("paste")}>📋 Paste codes / links</TextBtn>}
            {d.can_add_sales && <TextBtn onClick={() => setModal("sales")}>➕ Add sales</TextBtn>}
            {d.can_add_sales && <TextBtn onClick={() => setModal("report")}>📤 Upload order report</TextBtn>}
            <TextBtn onClick={download}>⬇️ Download</TextBtn>
          </>
        }
      >
        {data && (
          <Note tone="amber" icon="🔗">
            {!on && <b>Tracking is off for this campaign — links below are ready either way. </b>}
            Opens{" "}
            {edit ? (
              <span className="at-edit">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Destination link" placeholder="https://brand.com/…" />
                <button type="button" onClick={saveDest}>
                  Save
                </button>
              </span>
            ) : (
              <b>{dest ? dest.replace(/^https?:\/\//, "").slice(0, 60) : "no shop link yet"}</b>
            )}
            {" · "}
            {MODE[mode] || mode}
            {mode === "common" && cfg.common_code ? ` (${cfg.common_code})` : ""}
            {cfg.discount ? ` · ${cfg.discount}` : ""} · {cfg.utm === false ? "UTM off" : "UTM on (utm_source=geek)"}
            {cfg.shopify_code ? " · Shopify code auto-applied" : ""} ·{" "}
            {!edit && d.can_edit && (
              <button
                type="button"
                className="at-change"
                onClick={() => {
                  setDraft(dest);
                  setEdit(true);
                }}
              >
                ✏️ Change
              </button>
            )}
          </Note>
        )}

        <div className="at-stats">
          <MiniStats
            items={[
              { value: num(L.length), label: "Creators with a link", note: `${T.active} got clicks` },
              { value: num(T.clicks), label: "Link clicks", note: `${num(T.unique)} unique` },
              { value: num(T.copies), label: "Code copies" },
              { value: num(T.shop), label: "Went to the shop" },
              { value: num(T.orders + nsOrders), label: "Orders", note: nsOrders ? `${num(nsOrders)} not split by creator` : "" },
              { value: inr(T.sales + nsSales), label: "Sales" },
            ]}
          />
        </div>

        <div className="at-bar">
          <select className="ad-input at-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {SORTS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <input className="ad-input at-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creator…" aria-label="Search creator" />
        </div>

        <div className="c2-tw">
          <table className="c2-t at-t">
            <thead>
              <tr>
                <th>Creator</th>
                <th>Geek link</th>
                <th>Code</th>
                <th>Clicks</th>
                <th>Unique</th>
                <th>Copies</th>
                <th>To shop</th>
                <th>Orders</th>
                <th>Sales</th>
                <th>Last click</th>
              </tr>
            </thead>
            <tbody>
              <TableState
                cols={10}
                loading={loading && !data}
                error={!data && error}
                onRetry={reload}
                empty={data && !list.length && (L.length ? `No creator matches “${q}”.` : "No creators on this campaign yet — every creator added gets a link automatically.")}
              />
              {list.map((x) => (
                <tr key={x.link_id}>
                  <td>
                    <b>{x.handle ? `@${x.handle}` : x.name || "Creator"}</b>
                  </td>
                  <td className="at-link">
                    /go/{x.slug}{" "}
                    <button type="button" className="c2-link" onClick={() => copy(x)}>
                      Copy
                    </button>
                  </td>
                  <td>
                    {mode === "none" && !x.own_code ? (
                      "—"
                    ) : d.can_edit ? (
                      <button type="button" className="at-code" onClick={() => setCode(x)} title="Change code">
                        {x.code || "add code"}
                      </button>
                    ) : (
                      x.code || "no code yet"
                    )}
                  </td>
                  <td>{num(x.clicks)}</td>
                  <td>{num(x.unique)}</td>
                  <td>{num(x.copies)}</td>
                  <td>{num(x.shop)}</td>
                  <td>{num(x.orders)}</td>
                  <td>{+x.sales ? inr(x.sales) : "—"}</td>
                  <td>{ago(x.last_click)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {modal && <TrackModal kind={modal} campaign={id} data={d} onClose={() => setModal(null)} onDone={(m) => (setModal(null), show(m), reload(true))} />}
      {toast}

      <style>{`
        .at-change { padding: 0; border: 0; background: none; font-size: 12px; color: inherit; }
        .at-change:hover { text-decoration: underline; }
        .at-edit { display: inline-flex; gap: 6px; vertical-align: middle; }
        .at-edit input { height: 24px; padding: 0 8px; border: 1px solid #f0cf94; border-radius: 7px; font-size: 12px; background: #fff; color: var(--ad-ink); outline: none; }
        .at-edit button { height: 24px; padding: 0 9px; border: 0; border-radius: 7px; background: #986016; color: #fff; font-size: 11px; font-weight: 700; }
        .at-stats { margin-top: 16px; }
        .at-bar { display: flex; gap: 10px; margin-top: 22px; }
        .at-sort { width: 158px; height: 44px; padding: 0 12px; cursor: pointer; -webkit-appearance: none; appearance: none; }
        .at-q { width: 270px; height: 44px; }
        .at-t { margin-top: 13px; }
        .at-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        .at-link { font-size: 12px; }
        .at-link .c2-link { padding: 0; border: 0; background: none; font-size: 13px; }
        .at-code { padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
        .at-code:hover { color: var(--ad-primary); text-decoration: underline; }
        @media (max-width: 640px) {
          .at-bar { flex-direction: column; }
          .at-sort, .at-q { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
