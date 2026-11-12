"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Panel, Note, MiniStats, TextBtn, useToast, copyText, downloadFile } from "@/components/admin/campaign2/kit";

const ROWS = [
  { name: "Nisha Rao", link: "/go/7a8f0be", code: "NISHA10", clicks: 88, unique: 71, copies: 22, shop: 19, orders: 7, sales: 7693, last: "Today", rank: 3 },
  { name: "Kabir Mehta", link: "/go/3e7f2b6", code: "KABIR10", clicks: 64, unique: 52, copies: 18, shop: 12, orders: 5, sales: 5495, last: "Yesterday", rank: 2 },
  { name: "Aditi Verma", link: "/go/91c2d4a", code: "ADITI10", clicks: 41, unique: 33, copies: 9, shop: 8, orders: 2, sales: 2198, last: "2 days", rank: 1 },
];
const SORTS = { "Most clicks": "clicks", "Most orders": "orders", "Most sales": "sales", "Latest click": "rank" };
const inr = (n) => `₹${n.toLocaleString("en-IN")}`;

export default function CampaignAttribution() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const [sort, setSort] = useState("Most clicks");
  const [q, setQ] = useState("");
  const [dest, setDest] = useState("beardo.in/detan");
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(dest);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ROWS.filter((r) => !t || `${r.name} ${r.code}`.toLowerCase().includes(t)).sort((a, b) => b[SORTS[sort]] - a[SORTS[sort]]);
  }, [q, sort]);

  const copy = async (r) => {
    await copyText(`https://geek.link${r.link}`);
    show(`Copied geek.link${r.link}`);
  };

  return (
    <AdminShell>
      <WorkspaceHead id={id} />

      <Panel
        title="🔗 Links & codes"
        sub="Every creator’s own link and code — clicks, code copies, orders, sales."
        actions={
          <>
            <TextBtn onClick={() => show("Paste codes / links — 3 creators already have one")}>📋 Paste codes / links</TextBtn>
            <TextBtn onClick={() => show("Add sales: pick a creator and enter the order value")}>➕ Add sales</TextBtn>
            <TextBtn onClick={() => show("Order report uploaded · 19 orders matched")}>📤 Upload order report</TextBtn>
            <TextBtn
              onClick={() => {
                downloadFile("links-and-codes.csv", [["Creator", "Geek link", "Code", "Clicks", "Unique", "Copies", "To shop", "Orders", "Sales", "Last click"], ...ROWS.map((r) => [r.name, r.link, r.code, r.clicks, r.unique, r.copies, r.shop, r.orders, r.sales, r.last])]);
                show("Links & codes downloaded");
              }}
            >
              ⬇️ Download
            </TextBtn>
          </>
        }
      >
        <Note tone="amber" icon="🔗">
          Opens{" "}
          {edit ? (
            <span className="at-edit">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Destination link" />
              <button
                type="button"
                onClick={() => {
                  setDest(draft.trim() || dest);
                  setEdit(false);
                  show("Destination updated for every link");
                }}
              >
                Save
              </button>
            </span>
          ) : (
            <b>{dest}</b>
          )}
          · Code + link · UTM on (utm_source=geek) ·{" "}
          {!edit && (
            <button type="button" className="at-change" onClick={() => setEdit(true)}>
              ✏️ Change
            </button>
          )}
        </Note>

        <div className="at-stats">
          <MiniStats
            items={[
              { value: 24, label: "Creators with a link" },
              { value: 312, label: "Link clicks", note: "241 unique" },
              { value: 88, label: "Code copies" },
              { value: 64, label: "Went to the shop" },
              { value: 19, label: "Orders" },
              { value: "₹20,881", label: "Sales" },
            ]}
          />
        </div>

        <div className="at-bar">
          <select className="ad-input at-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {Object.keys(SORTS).map((s) => (
              <option key={s}>{s}</option>
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
              {list.map((r) => (
                <tr key={r.code}>
                  <td>
                    <b>{r.name}</b>
                  </td>
                  <td className="at-link">
                    {r.link}{" "}
                    <button type="button" className="c2-link" onClick={() => copy(r)}>
                      Copy
                    </button>
                  </td>
                  <td>{r.code}</td>
                  <td>{r.clicks}</td>
                  <td>{r.unique}</td>
                  <td>{r.copies}</td>
                  <td>{r.shop}</td>
                  <td>{r.orders}</td>
                  <td>{inr(r.sales)}</td>
                  <td>{r.last}</td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={10} className="at-empty">
                    No creator matches “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
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
        .at-empty { text-align: center; color: var(--ad-muted); }
        @media (max-width: 640px) {
          .at-bar { flex-direction: column; }
          .at-sort, .at-q { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
