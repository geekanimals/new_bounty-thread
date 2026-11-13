"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BrandShell from "@/components/brands/BrandShell";
import { BrLoading, BrEmpty, BrError } from "@/components/brands/BrandStates";
import { useApprovals, useRejectionReasons, declineCreator, bWho, BRIEF_REASON } from "@/services/brand";
import { ArrowLeft, Info, Check, Users } from "@/components/ui/Icons";

/**
 * /brands/approvals/decline/[id] — creator ko decline karo, wajah ke saath
 * (purana data-bpxno → app.js openReasonModal: api.rejection_reasons se wajah + creator ke liye message → org_decide_applicant p_approve:false).
 * id = participation_id. "?more=id2,id3" = bulk decline — wahi wajah + message sab ko (app.js opt.count).
 */
export default function DeclineCreator() {
  const { id } = useParams();
  const a = useApprovals();
  const rs = useRejectionReasons();
  const [more, setMore] = useState([]);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [auto, setAuto] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null); // { n, bad: [] }
  const [snap, setSnap] = useState(null);

  // ?more= sirf browser mein padho (render mein window nahi)
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("more") || "";
    setMore(m.split(",").filter(Boolean));
  }, []);
  const x = a.toApprove.find((r) => r.participation_id === id);
  useEffect(() => {
    if (x) setSnap(x);
  }, [x]);
  const row = x || snap;
  const ids = [id, ...more.filter((m) => m !== id && a.toApprove.some((r) => r.participation_id === m))];
  const c = bWho(row ? row.creator : null);
  const brief = rs.list.filter((r) => BRIEF_REASON.test(r.code));
  const rest = rs.list.filter((r) => !BRIEF_REASON.test(r.code));
  const pickLabel = (rs.list.find((r) => r.code === code) || {}).label || "";

  // wajah chuno → message mein ready line (app.js jaisa — badal sakte ho)
  const pick = (r) => {
    setCode(r.code);
    setErr("");
    if (!note.trim() || note === auto) {
      const t = r.code === "other" ? "" : `${r.label}.`;
      setAuto(t);
      setNote(t);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!code) return setErr("Pick a reason.");
    if (!note.trim()) return setErr("Write a short message for the creator.");
    setBusy(true);
    setErr("");
    const bad = [];
    for (const pid of ids) {
      const r = await declineCreator(pid, code, note.trim());
      if (r.error) bad.push(r.error.message);
    }
    setBusy(false);
    if (bad.length === ids.length) return setErr(bad[0]);
    setDone({ n: ids.length - bad.length, bad });
    a.reload();
  };

  const radios = (L) =>
    L.map((r) => (
      <label key={r.code} className={`dc-reason ${code === r.code ? "is-on" : ""}`}>
        <input type="radio" name="reason" value={r.code} checked={code === r.code} onChange={() => pick(r)} />
        <i />
        {r.label}
      </label>
    ));

  return (
    <BrandShell crumbs={[{ label: "Approvals", href: "/brands/approvals" }, { label: `Decline ${row ? c.name : "creator"}` }]}>
      <title>{`Decline ${row ? c.name : "creator"} — Geek OS Brand`}</title>

      <Link href="/brands/approvals" className="br-back">
        <span>
          <ArrowLeft size={13} />
        </span>
        Back to Approvals
      </Link>

      {a.loading ? (
        <BrLoading rows={5} />
      ) : a.error ? (
        <BrError error={a.error} onRetry={a.reload} />
      ) : !row && !done ? (
        <BrEmpty title="This creator isn’t waiting for approval" text="They were already approved or declined — or the link is old.">
          <Link href="/brands/approvals" className="br-btn br-btn--primary br-btn--sm">
            Back to Approvals
          </Link>
        </BrEmpty>
      ) : !a.can ? (
        <BrEmpty title="View-only login" text="Approvals are done by your team’s approvers." />
      ) : (
        <div className="br-card dc">
          {done ? (
            <div className="dc-done">
              <span className="dc-done__ic">
                <Check size={20} />
              </span>
              <h1>{done.n > 1 ? `${done.n} creators declined` : `${c.name} declined`}</h1>
              <p>
                Reason: <strong>{pickLabel}</strong>. They get your message on WhatsApp, by email and in the app.
                {done.bad.length ? ` ${done.bad.length} couldn’t be declined: ${done.bad[0]}` : ""}
              </p>
              <div className="dc-done__btns">
                <Link href="/brands/approvals" className="br-btn br-btn--primary">
                  <Users size={14} /> Back to Approvals
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="dc-head">
                <span className="br-av br-av--lg" style={{ background: c.av }}>
                  {c.initials}
                </span>
                <div>
                  <h1>{ids.length > 1 ? `Decline ${ids.length} creators?` : `Decline ${c.name}?`}</h1>
                  <p>{[c.handle, row && row.campaign].filter(Boolean).join(" · ")}</p>
                </div>
              </div>

              <p className="dc-q">Why isn’t this creator right for the campaign?</p>
              {rs.loading ? (
                <BrLoading rows={3} />
              ) : rs.error ? (
                <BrError error={rs.error.message} />
              ) : (
                <>
                  {brief.length > 0 && <p className="dc-grp">Doesn’t match the brief</p>}
                  {brief.length > 0 && (
                    <div className="dc-reasons" role="radiogroup">
                      {radios(brief)}
                    </div>
                  )}
                  {brief.length > 0 && rest.length > 0 && <p className="dc-grp">Other reasons</p>}
                  <div className="dc-reasons" role="radiogroup">
                    {radios(rest)}
                  </div>
                </>
              )}

              <label className="br-label" htmlFor="dc-note">
                Message to the creator — why they weren’t selected
              </label>
              <textarea
                id="dc-note"
                className="br-input"
                rows={3}
                maxLength={400}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setErr("");
                }}
                placeholder="e.g. The brand needs creators based in Jaipur for this campaign."
              />
              {err && <p className="dc-err">{err}</p>}

              <p className="dc-info">
                <Info size={14} /> Sent as it is on WhatsApp, by email and in the app: “You were not selected for this campaign. Reason: …”
                {ids.length > 1 ? ` The same reason and message go to all ${ids.length} creators.` : ""}
              </p>

              <div className="dc-foot">
                <Link href="/brands/approvals" className="br-btn br-btn--ghost">
                  Cancel
                </Link>
                <button type="submit" className="br-btn br-btn--danger" disabled={busy}>
                  {busy ? "Declining…" : ids.length > 1 ? `Decline ${ids.length} creators` : "Decline creator"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

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
              .dc-grp { margin: 0 0 8px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--br-faint); }
        .dc-err { margin: 8px 0 0; font-size: 12.5px; font-weight: 600; color: var(--br-red); }
`}</style>
    </BrandShell>
  );
}
