"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { campaignById } from "@/components/admin/data";

const ITEMS = [
  { t: "Review submitted video drafts", s: "Beardo Detan Express Kit · 21 items", href: "/admin/action-queue/content" },
  { t: "Review Circle campaign submissions", s: "Circle Diwali Declutter · Barter · 9 items", href: "/admin/action-queue/content" },
];

/* Figma: Campaign workspace — Content submissions */
export default function WorkspaceContent() {
  const { id } = useParams();
  const c = campaignById(id);
  return (
    <AdminShell>
      <WorkspaceHead id={c.id} />
      <section className="ad-card wct">
        <h2 className="ad-h2">Content submissions</h2>
        <p className="wct-sub">Review against brief, ad disclosure, rights and creator consent.</p>
        <div className="wct-list">
          {ITEMS.map((i) => (
            <div key={i.t} className="wct-row">
              <span className="wct-ic">▶️</span>
              <div className="wct-main">
                <b>{i.t}</b>
                <span>{i.s}</span>
              </div>
              <Link href={i.href} className="ad-btn ad-btn--ghost wct-btn">
                Review →
              </Link>
            </div>
          ))}
        </div>
      </section>
      <style>{`
        .wct { padding: 22px 22px 30px; }
        .wct-sub { margin-top: 8px; font-size: 12px; color: var(--ad-muted); }
        .wct-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .wct-row { display: flex; align-items: center; gap: 14px; min-height: 68px; padding: 13px 13px; border-radius: 14px; border: 1px solid var(--ad-line); transition: border-color .15s; }
        .wct-row:hover { border-color: #cfd2ee; }
        .wct-ic { width: 38px; height: 38px; flex-shrink: 0; border-radius: 11px; display: grid; place-items: center; background: var(--ad-soft); font-size: 19px; }
        .wct-main { flex: 1; min-width: 0; }
        .wct-main b { display: block; font-size: 14px; font-weight: 700; color: var(--ad-ink); }
        .wct-main span { display: block; margin-top: 2px; font-size: 12px; color: #8791a7; }
        .wct-btn { height: 41px; padding: 0 15px; }
        @media (max-width: 640px) {
          .wct { padding: 18px 14px; }
          .wct-row { flex-wrap: wrap; }
          .wct-btn { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
