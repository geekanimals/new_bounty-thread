"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { Panel, Table, useToast } from "@/components/admin/settings/kit";

const USERS = [
  { id: "nisha-rao", name: "Nisha Rao · @nishastories", role: "Creator", joined: "2 Oct", last: "Today", profile: "92%", state: "complete", href: "/admin/creators/nisha-rao/profile" },
  { id: "kabir-mehta", name: "Kabir Mehta · @kabirfoodtrail", role: "Creator", joined: "12 Oct", last: "Today", profile: "64%", state: "incomplete", href: "/admin/creators/kabir-mehta/profile" },
  { id: "pixel-bloom-media", name: "Pixel Bloom Media", role: "Agency", joined: "Today", last: "Today", profile: "—", state: "incomplete", href: "/admin/settings/workspaces" },
  { id: "beardo", name: "Beardo", role: "Brand", joined: "14 Sep", last: "Yesterday", profile: "—", state: "incomplete", href: "/admin/brands/beardo/overview" },
  { id: "ananya-iyer", name: "Ananya Iyer · @ananya.travels", role: "Creator", joined: "20 Oct", last: "3 days", profile: "48%", state: "incomplete", href: "/admin/creators/ananya-iyer/profile" },
  { id: "aarav-shah", name: "Aarav Shah · @aaravcreates", role: "Creator", joined: "18 Sep", last: "2 days", profile: "100%", state: "complete", href: "/admin/creators/aarav-shah/profile" },
  { id: "ritika-sen", name: "Ritika Sen · @ritika.daily", role: "Creator", joined: "5 Nov", last: "Never", profile: "12%", state: "never", href: "/admin/creators/ritika-sen/profile" },
  { id: "rohan-das", name: "Rohan Das · @rohanfitlife", role: "Creator", joined: "9 Oct", last: "3 h ago", profile: "58%", state: "incomplete", href: "/admin/creators/rohan-das/profile" },
];
const FILTERS = [
  { k: "all", label: "All" },
  { k: "complete", label: "✅ Profile complete 34" },
  { k: "incomplete", label: "🧩 Incomplete 270" },
  { k: "never", label: "💤 Never signed in 1" },
  { k: "pending", label: "⏳ Pending approval 0" },
];
const PER = 5;

export default function AllUsers() {
  const [list, setList] = useState(USERS);
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [del, setDel] = useState(null);
  const [toast, say] = useToast();

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return list.filter((u) => (f === "all" || u.state === f) && (!t || u.name.toLowerCase().includes(t) || u.role.toLowerCase().includes(t)));
  }, [list, f, q]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const pg = Math.min(page, pages - 1);
  const shown = rows.slice(pg * PER, pg * PER + PER);
  const total = 316 - (USERS.length - list.length);

  const remove = () => {
    setList((l) => l.filter((u) => u.id !== del.id));
    say(`${del.name.split(" · ")[0]} removed`);
    setDel(null);
  };

  return (
    <AdminShell>
      <PageHead title="All users" sub="Every account on Geek OS — creators, agencies, brands and admins." />
      <Stats
        items={[
          { value: 310, label: "Everyone", note: "Live" },
          { value: 298, label: "Creators", href: "/admin/creators" },
          { value: 10, label: "Agencies & brands", href: "/admin/brands" },
          { value: 2, label: "Joined today" },
          { value: 263, label: "Profile incomplete" },
        ]}
      />

      <Panel className="au-panel">
        <div className="au-top">
          <h2 className="ad-h2 au-title">Everyone · 310</h2>
          <div className="au-right">
            <div className="au-filters" role="tablist">
              {FILTERS.map((x) => (
                <button
                  key={x.k}
                  type="button"
                  role="tab"
                  aria-selected={f === x.k}
                  className={`ad-tab ${f === x.k ? "is-on" : ""}`}
                  onClick={() => {
                    setF(x.k);
                    setPage(0);
                  }}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <input
              className="ad-input au-search"
              placeholder="Search name, email, @handle…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              aria-label="Search users"
            />
          </div>
        </div>
        <Table
          rowH={64}
          minW={860}
          empty="No users match this filter."
          cols={[
            { label: "Person", w: 325 },
            { label: "Role", w: 104 },
            { label: "Joined", w: 99 },
            { label: "Last sign-in", w: 156 },
            { label: "Profile", w: 115 },
            { label: "", w: 277 },
          ]}
          rows={shown.map((u) => [
            <b key="n">{u.name}</b>,
            u.role,
            u.joined,
            u.last,
            u.profile,
            <span key="a" className="au-acts">
              <Link href={u.href} className="sk-link">
                Profile
              </Link>
              <Link href={`/admin/activity/${u.id}`} className="sk-link">
                Activity
              </Link>
              <button type="button" className="sk-link au-del" onClick={() => setDel(u)} aria-label={`Delete ${u.name}`}>
                🗑
              </button>
            </span>,
          ])}
        />
        <div className="au-foot">
          <p>
            Showing {rows.length ? pg * PER + 1 : 0}–{pg * PER + shown.length} of {f === "all" && !q ? total : rows.length}
          </p>
          <div>
            <button type="button" className="sk-link au-pg" disabled={pg === 0} onClick={() => setPage(pg - 1)}>
              ← Prev
            </button>
            <button type="button" className="sk-link au-pg" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>
              Next →
            </button>
          </div>
        </div>
      </Panel>

      {del && (
        <div className="ad-overlay" onClick={() => setDel(null)}>
          <div className="ad-modal au-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete account">
            <h2 className="ad-h2">Delete this account?</h2>
            <p className="au-modal__p">
              <b>{del.name}</b> will lose access to Geek OS. Their campaign history stays in the audit log. This can’t be undone.
            </p>
            <div className="au-modal__btns">
              <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setDel(null)}>
                Keep
              </button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={remove}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
      {toast}

      <style>{`
        .au-panel { padding-bottom: 26px; }
        .au-top { display: flex; align-items: center; gap: 30px; }
        .au-title { width: 102px; flex-shrink: 0; line-height: 1.35; }
        .au-right { min-width: 0; flex: 1; }
        .au-filters { display: flex; flex-wrap: wrap; gap: 8px; }
        .au-filters .ad-tab { height: 37px; }
        .au-filters .ad-tab:not(.is-on) { color: #67718a; }
        .au-search { width: min(270px, 100%); height: 43px; margin-top: 25px; }
        .au-panel .sk-tw { margin-top: 27px; }
        .au-acts { display: inline-flex; align-items: center; gap: 22px; padding-left: 4px; }
        .au-del { font-size: 13px; filter: grayscale(1); opacity: .55; } /* Figma: grey bin */
        .au-del:hover { opacity: 1; filter: none; }
        .au-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; }
        .au-foot p { font-size: 12px; color: var(--ad-muted); }
        .au-foot div { display: flex; gap: 26px; padding-right: 10px; }
        .au-pg { font-size: 14px; }
        .au-pg:disabled { cursor: default; } /* Figma: Prev bhi same rang */
        .au-modal { width: min(440px, 100%); padding: 24px; }
        .au-modal__p { margin-top: 10px; font-size: 13.5px; line-height: 1.55; color: var(--ad-muted); }
        .au-modal__p b { color: var(--ad-ink); }
        .au-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 1023px) { .au-top { flex-direction: column; align-items: flex-start; gap: 14px; } .au-title { width: auto; } }
        @media (max-width: 640px) {
          .au-filters { flex-wrap: nowrap; overflow-x: auto; margin-right: -16px; scrollbar-width: none; }
          .au-filters .ad-tab { flex-shrink: 0; }
          .au-right { width: 100%; }
          .au-search { width: 100%; margin-top: 14px; }
          .au-panel .sk-tw { margin-top: 18px; }
          .au-foot div { padding-right: 0; gap: 18px; }
          .au-modal__btns > * { flex: 1; }
        }
      `}</style>
    </AdminShell>
  );
}
