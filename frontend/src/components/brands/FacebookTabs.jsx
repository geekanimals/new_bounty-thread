"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, ChevronDown } from "@/components/ui/Icons";
import { BrLoading, BrError } from "@/components/brands/BrandStates";
import { fbLinkStart, bShort } from "@/services/brand";

const TABS = [
  { label: "Posts", href: "/brands/facebook" },
  { label: "Create post", href: "/brands/facebook/create" },
  { label: "Insights", href: "/brands/facebook/insights" },
  { label: "Ads", href: "/brands/facebook/ads" },
];

/**
 * Facebook ke 4 pages ka common heading + tabs. fb = useFbPages() — upar Page ka naam (kai Pages hon to badal sakte ho, purana fbPageSel).
 */
export default function FacebookTabs({ fb }) {
  const pathname = usePathname() || "";
  const pages = (fb && fb.pages) || [];
  const page = fb && fb.page;
  return (
    <div className="fbt">
      <p className="br-eyebrow">Social</p>
      <div className="fbt-head">
        <div>
          <h1 className="br-h1">Facebook</h1>
          <p className="br-sub">Your Facebook Page and ads — reply to comments, post, and see results without leaving Geek OS.</p>
        </div>
        {page && (
          <label className="fbt-page">
            <Facebook size={12} /> {page.name}
            {pages.length > 1 && (
              <>
                <ChevronDown size={12} />
                <select aria-label="Pick a Facebook Page" value={page.id} onChange={(e) => fb.setPage(e.target.value)}>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.followers != null ? ` · ${bShort(p.followers)} followers` : ""}
                    </option>
                  ))}
                </select>
              </>
            )}
          </label>
        )}
      </div>
      <nav className="br-tabs" style={{ marginTop: 20 }} aria-label="Facebook sections">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={pathname === t.href ? "is-active" : ""}>
            {t.label}
          </Link>
        ))}
      </nav>
      <style>{`
        .fbt-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .fbt-page {
          position: relative; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 12px; max-width: 100%;
          border-radius: 999px; background: var(--br-blue-bg); color: var(--br-fb);
          font-size: 12px; font-weight: 700; white-space: nowrap;
        }
        .fbt-page select { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
      `}</style>
    </div>
  );
}

/**
 * Facebook pages ke states (purana paintFacebook): link nahi → "Connect Facebook", error → "Reconnect",
 * koi Page share nahi → reconnect. Sab theek → children(page).
 */
export function FbGate({ fb, children }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const connect = async () => {
    setBusy(true);
    setErr("");
    const r = await fbLinkStart();
    if (r && r.error) {
      setErr(r.error.message || String(r.error));
      setBusy(false);
    }
  };
  const btn = (label) => (
    <button type="button" className="br-btn br-btn--primary br-btn--sm" onClick={connect} disabled={busy || !fb.can}>
      <Facebook size={13} /> {busy ? "Opening Facebook…" : label}
    </button>
  );

  let body;
  if (!fb.ready || fb.loading) body = <BrLoading rows={4} />;
  else if (fb.error && !fb.linked) body = <BrError error={fb.error.message} />;
  else if (!fb.linked)
    body = (
      <div className="br-card fbg">
        <h2>Connect your Facebook business</h2>
        <p>Link the Facebook account that manages your brand’s Page and ad accounts (Business Manager). Then, right here, you can:</p>
        <ul>
          <li>Switch between all your Pages</li>
          <li>Publish or schedule posts, links and photos</li>
          <li>Read, reply to, hide or delete comments</li>
          <li>See Page insights — reach, impressions, engagement, follows</li>
          <li>See ad campaigns with spend and results, and pause / resume them</li>
        </ul>
        {btn("Connect Facebook")}
        {!fb.can && <p className="fbg-note">View-only login — your team’s admin links Facebook.</p>}
      </div>
    );
  else if (fb.error)
    body = (
      <>
        <BrError error={fb.error.message} onRetry={fb.reload} />
        {fb.reconnect && <div className="fbg-re">{btn("Reconnect Facebook")}</div>}
      </>
    );
  else if (!fb.page)
    body = (
      <div className="br-card fbg">
        <h2>No Pages shared yet</h2>
        <p>Reconnect Facebook and, on Facebook’s screen, tick the Pages (and ad accounts) Geek OS may manage.</p>
        {btn("Reconnect Facebook")}
      </div>
    );
  else return children(fb.page);

  return (
    <>
      {body}
      {err && <p className="fbg-err">{err}</p>}
      <style>{`
        .fbg { padding: 24px; }
        .fbg h2 { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
        .fbg p { margin: 0 0 10px; font-size: 13.5px; line-height: 1.55; color: var(--br-muted); }
        .fbg ul { margin: 0 0 16px; padding-left: 18px; display: grid; gap: 4px; font-size: 13px; color: var(--br-text); }
        .fbg-note { margin-top: 10px !important; font-size: 12.5px !important; }
        .fbg-re { margin-top: 12px; }
        .fbg-err { margin: 10px 0 0; font-size: 12.5px; font-weight: 600; color: var(--br-red); }
      `}</style>
    </>
  );
}
