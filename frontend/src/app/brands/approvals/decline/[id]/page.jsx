"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { getCreator, DECLINE_REASONS, APPROVAL_CREATORS } from "@/components/brands/data";
import { ArrowLeft, Info, Check, Users } from "@/components/ui/Icons";

/** /brands/approvals/decline/[id] — creator ko decline karo, wajah ke saath */
export default function DeclineCreator() {
  const { id } = useParams();
  const c = getCreator(id);
  const [reason, setReason] = useState(DECLINE_REASONS[0]);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  if (!c || !APPROVAL_CREATORS.includes(id)) notFound();

  return (
    <BrandShell crumbs={[{ label: "Approvals", href: "/brands/approvals" }, { label: `Decline ${c.name}` }]}>
      <title>{`Decline ${c.name} — Geek OS Brand`}</title>

      <Link href="/brands/approvals" className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        Back to Approvals
      </Link>

      <div className="br-card dc">
        {done ? (
          <div className="dc-done">
            <span className="dc-done__ic">
              <Check size={20} />
            </span>
            <h1>{c.name} declined</h1>
            <p>
              Reason: <strong>{reason}</strong>. Geek reads your note and suggests a better-matched creator within 24 hours — you’ll see them in
              Approvals.
            </p>
            <div className="dc-done__btns">
              <Link href="/brands/approvals" className="br-btn br-btn--primary">
                <Users size={14} /> Back to Approvals
              </Link>
              <button type="button" className="br-btn br-btn--ghost" onClick={() => setDone(false)}>
                Undo
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
          >
            <div className="dc-head">
              <span className="br-av br-av--lg" style={{ background: c.av }}>
                {c.initials}
              </span>
              <div>
                <h1>Decline {c.name}?</h1>
                <p>{c.handle} · Festive Glow Edit</p>
              </div>
            </div>

            <p className="dc-q">Why isn’t this creator right for the campaign?</p>
            <div className="dc-reasons" role="radiogroup">
              {DECLINE_REASONS.map((r) => (
                <label key={r} className={`dc-reason ${reason === r ? "is-on" : ""}`}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  <i />
                  {r}
                </label>
              ))}
            </div>

            <label className="br-label" htmlFor="dc-note">
              Anything to add? (optional)
            </label>
            <textarea
              id="dc-note"
              className="br-input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="We need more 25–34 working women — her audience skews college."
            />

            <p className="dc-info">
              <Info size={14} /> Geek reads this and suggests a better-matched creator within 24 hours.
            </p>

            <div className="dc-foot">
              <Link href="/brands/approvals" className="br-btn br-btn--ghost">
                Cancel
              </Link>
              <button type="submit" className="br-btn br-btn--danger">
                Decline creator
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .dc { padding: 24px; }
        .dc-head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
        .dc-head h1 { margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
        .dc-head p { margin: 2px 0 0; font-size: 12.5px; color: var(--br-muted); }
        .dc-q { margin: 0 0 10px; font-size: 14px; font-weight: 700; }
        .dc-reasons { display: grid; gap: 8px; margin-bottom: 18px; }
        .dc-reason {
          display: flex; align-items: center; gap: 12px; min-height: 46px; padding: 10px 14px;
          border: 1px solid var(--br-border); border-radius: 11px; cursor: pointer;
          font-size: 13.5px; font-weight: 500; transition: border-color .2s, background .2s;
        }
        .dc-reason:hover { border-color: var(--br-border-2); }
        .dc-reason input { position: absolute; opacity: 0; pointer-events: none; }
        .dc-reason i { width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%; border: 1.5px solid var(--br-border-2); background: #fff; }
        .dc-reason.is-on { border-color: var(--br-primary); background: var(--br-lilac); font-weight: 600; }
        .dc-reason.is-on i { border: 5px solid var(--br-primary); }
        .dc-reason:focus-within { box-shadow: 0 0 0 3px rgba(109,74,255,.15); }
        .dc-info { display: flex; align-items: center; gap: 8px; margin: 16px 0 18px; padding: 11px 14px; border-radius: 11px; background: var(--br-blue-bg); color: var(--br-blue); font-size: 12.5px; }
        .dc-foot { display: flex; justify-content: flex-end; gap: 10px; }

        .dc-done { text-align: center; padding: 18px 0; }
        .dc-done__ic { width: 52px; height: 52px; margin: 0 auto 14px; border-radius: 50%; background: var(--br-ink); color: #fff; display: grid; place-items: center; }
        .dc-done h1 { margin: 0 0 8px; font-size: 21px; font-weight: 800; }
        .dc-done p { max-width: 520px; margin: 0 auto 18px; font-size: 13.5px; line-height: 1.6; color: var(--br-muted); }
        .dc-done p strong { color: var(--br-ink); }
        .dc-done__btns { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 640px) {
          .dc { padding: 18px; }
          .dc-foot .br-btn { flex: 1; }
        }
      `}</style>
    </BrandShell>
  );
}
