"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell, { useAdmin } from "@/components/admin/AdminShell";
import { PageHead, Stats } from "@/components/admin/ui";
import { Panel, Table, useToast, fmtDate, fmtDateTime, fmtNum, ago, emptyState } from "@/components/admin/settings/kit";
import { rpc, useRpc, errText } from "@/lib/supabase";

const ROLE = { creator: "Creator", owner: "Agency", brand: "Brand", manager: "Manager", corporate: "Corporate", admin: "Admin" };
const FAKE_EMAIL = /@creators\.bountythreads\.app$/i;
const PER = 40; // purane app jaisa: 40 per page
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const isToday = (t) => !!t && new Date(t) >= startOfToday();
const FILTERS = [
  { k: "all", label: "All", fn: () => true },
  { k: "complete", label: "✅ Profile complete", fn: (u) => u.role === "creator" && u.profile_complete },
  { k: "incomplete", label: "🧩 Incomplete", fn: (u) => u.role === "creator" && u.profile_complete === false },
  { k: "never", label: "💤 Never signed in", fn: (u) => !u.last_sign_in_at },
  { k: "pending", label: "⏳ Pending approval", fn: (u) => u.status === "pending" },
];
const nameOf = (u) => (u.name && u.name !== "Creator" ? u.name : "") || (u.ig_username ? `@${u.ig_username}` : "") || (u.email && !FAKE_EMAIL.test(u.email) ? u.email : "") || u.whatsapp || "Name not added";
const profileHref = (u) => (u.role === "creator" ? `/vault/creators/${u.member_id}/profile` : u.role === "brand" ? "/vault/brands" : "/vault/settings/workspaces");

/** "Delete" button sirf dusron ke liye — khud ko delete nahi */
function DelBtn({ u, onClick }) {
  const me = useAdmin();
  const email = u.email && !FAKE_EMAIL.test(u.email) ? u.email : "";
  if (me?.email && email && me.email.toLowerCase() === email.toLowerCase()) return null;
  return (
    <button type="button" className="sk-link au-del" onClick={onClick} aria-label={`Delete ${nameOf(u)}`} title="Delete this user and all their data">
      🗑
    </button>
  );
}

/** /vault/users — har login wala account (admin_users, har 30 sec live) · delete = admin_delete_user */
export default function AllUsers() {
  const res = useRpc("admin", "admin_users", {}, { refreshMs: 30000 });
  const all = useMemo(() => res.data || [], [res.data]);
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [del, setDel] = useState(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, say] = useToast();

  const count = (k) => all.filter(FILTERS.find((x) => x.k === k).fn).length;
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const fn = FILTERS.find((x) => x.k === f).fn;
    return all
      .filter(fn)
      .filter((u) => !t || [u.name, u.ig_username, u.whatsapp, u.email, u.org_name, u.last_city, u.last_region, u.role].filter(Boolean).join(" ").toLowerCase().includes(t))
      .sort((a, b) => new Date(b.joined_at || 0) - new Date(a.joined_at || 0));
  }, [all, f, q]);
  const pages = Math.max(1, Math.ceil(rows.length / PER));
  const pg = Math.min(page, pages - 1);
  const shown = rows.slice(pg * PER, pg * PER + PER);

  const remove = async () => {
    const u = del;
    setBusy(true);
    setMsg("");
    const { data, error } = await rpc("admin", "admin_delete_user", { p_member: u.member_id, p_confirm: typed.trim() });
    setBusy(false);
    if (error) return setMsg(errText(error));
    say(`🗑 ${nameOf(u)} deleted${data && data.campaigns_removed_from ? ` — removed from ${data.campaigns_removed_from} campaign(s)` : ""}. They can sign up again fresh.`);
    setDel(null);
    res.reload();
  };
  const L = (n) => (res.loading ? "…" : fmtNum(n));

  return (
    <AdminShell>
      <PageHead title="All users" sub="Every account on Geek OS — creators, agencies, brands and admins." />
      <Stats
        items={[
          { value: L(all.length), label: "Everyone", note: "Live" },
          { value: L(all.filter((u) => u.role === "creator").length), label: "Creators", href: "/vault/creators" },
          { value: L(all.filter((u) => u.role === "owner" || u.role === "brand").length), label: "Agencies & brands", href: "/vault/brands" },
          { value: L(all.filter((u) => isToday(u.joined_at)).length), label: "Joined today" },
          { value: L(count("incomplete")), label: "Profile incomplete" },
        ]}
      />

      <Panel className="au-panel">
        <div className="au-top">
          <h2 className="ga-h2 au-title">
            {FILTERS.find((x) => x.k === f).k === "all" ? "Everyone" : FILTERS.find((x) => x.k === f).label.replace(/^\S+\s/, "")} · {L(rows.length)}
          </h2>
          <div className="au-right">
            <div className="au-filters" role="tablist">
              {FILTERS.map((x) => (
                <button
                  key={x.k}
                  type="button"
                  role="tab"
                  aria-selected={f === x.k}
                  className={`ga-tab ${f === x.k ? "is-on" : ""}`}
                  onClick={() => {
                    setF(x.k);
                    setPage(0);
                  }}
                >
                  {x.label}
                  {x.k !== "all" && !res.loading ? ` ${fmtNum(count(x.k))}` : ""}
                </button>
              ))}
            </div>
            <input
              className="ga-input au-search"
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
          empty={emptyState({ loading: res.loading, error: res.error, reload: res.reload, empty: "No users match this filter." })}
          cols={[
            { label: "Person", w: 325 },
            { label: "Role", w: 104 },
            { label: "Joined", w: 99 },
            { label: "Last sign-in", w: 156 },
            { label: "Profile", w: 115 },
            { label: "", w: 277 },
          ]}
          rows={shown.map((u) => [
            <b key="n" title={[u.whatsapp, u.email && !FAKE_EMAIL.test(u.email) ? u.email : "", [u.last_city, u.last_region].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}>
              {nameOf(u)}
              {u.ig_username && u.name && u.name !== "Creator" ? ` · @${u.ig_username}` : ""}
              {u.role !== "creator" && u.org_name && u.org_name !== nameOf(u) ? ` · ${u.org_name}` : ""}
              {u.status === "pending" ? " · pending" : ""}
            </b>,
            ROLE[u.role] || u.role || "—",
            fmtDate(u.joined_at).replace(/ \d{4}$/, ""),
            <span key="l" title={u.last_sign_in_at ? fmtDateTime(u.last_sign_in_at) : ""}>
              {u.last_sign_in_at ? ago(u.last_sign_in_at) : "Never"}
            </span>,
            u.role !== "creator" ? "—" : u.profile_complete ? "100%" : u.profile_total ? `${Math.round((100 * (u.profile_done || 0)) / u.profile_total)}%` : "—",
            <span key="a" className="au-acts">
              <Link href={profileHref(u)} className="sk-link">
                Profile
              </Link>
              <Link href={`/vault/activity/${u.member_id}`} className="sk-link">
                Activity
              </Link>
              <DelBtn
                u={u}
                onClick={() => {
                  setTyped("");
                  setMsg("");
                  setDel(u);
                }}
              />
            </span>,
          ])}
        />
        <div className="au-foot">
          <p>
            Showing {rows.length ? pg * PER + 1 : 0}–{pg * PER + shown.length} of {fmtNum(rows.length)}
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
        <div className="ga-overlay" onClick={() => setDel(null)}>
          <div className="ga-modal au-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Delete account">
            <h2 className="ga-h2">Delete {nameOf(del)}?</h2>
            <p className="au-modal__p">
              Removes for good: their login, creator profile, Instagram and WhatsApp link, every campaign they were on, alerts and activity. Kept: campaigns they created (moved to you) and a record in the Audit log. They can
              sign up again fresh.
            </p>
            <label className="ga-label au-l" htmlFor="au-del">
              Type <b>DELETE</b> to confirm
            </label>
            <input id="au-del" className="ga-input" autoComplete="off" placeholder="DELETE" value={typed} onChange={(e) => setTyped(e.target.value)} />
            {msg && <p className="au-err">{msg}</p>}
            <div className="au-modal__btns">
              <button type="button" className="ga-btn ga-btn--ghost" onClick={() => setDel(null)}>
                Keep
              </button>
              <button type="button" className="ga-btn ga-btn--danger" onClick={remove} disabled={busy || typed.trim() !== "DELETE"}>
                {busy ? "Deleting…" : "Delete permanently"}
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
        .au-filters .ga-tab { height: 37px; }
        .au-filters .ga-tab:not(.is-on) { color: #67718a; }
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
        .au-l { margin-top: 14px; }
        .au-err { margin-top: 10px; font-size: 12.5px; font-weight: 700; color: var(--ad-red); }
        .au-modal__btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; }
        @media (max-width: 1023px) { .au-top { flex-direction: column; align-items: flex-start; gap: 14px; } .au-title { width: auto; } }
        @media (max-width: 640px) {
          .au-filters { flex-wrap: nowrap; overflow-x: auto; margin-right: -16px; scrollbar-width: none; }
          .au-filters .ga-tab { flex-shrink: 0; }
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
