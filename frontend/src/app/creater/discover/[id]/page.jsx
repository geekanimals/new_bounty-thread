"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BountyShell, { ConnectInstagramSheet } from "@/components/creater/BountyShell";
import { RumiTip } from "@/components/creater/OnboardShell";
import { useSession, useJoinGate, useOpenCampaigns, useCovers, coverOf, typeKey, kindOf, compLine, compSub, delivLine, whoList, fdate, checkEligibility, applyTo, myApplyProfiles, codeFill, safeLink, errText } from "@/services/creator";
import { TYPE_LABEL, APPLY_JOURNEY, getSidekick } from "@/components/creater/data";
import { ArrowLeft, Gift, Film, Users, Calendar, ShieldCheck, Megaphone, Lock, FileText, ChevronDown } from "@/components/ui/Icons";

const JOURNEY_ICONS = ["✎", "✓", "📦", "🎬", "📊"];
// participation stage → chhota label (purane STAGE_SHORT / spill)
const STAGE = {
  applied: "Applied", eligible: "Applied", shortlisted: "Shortlisted", invited: "Invited", sent_to_brand: "With brand",
  brand_confirmed: "Selected", accepted: "Selected", contract_sent: "Sign contract", contract_signed: "Contract signed",
  address_confirmed: "Address confirmed", product_sent: "Product sent", content_created: "Creating", content_submitted: "Video sent",
  changes_requested: "Changes requested", content_approved: "Approved", published: "Live", completed: "Completed",
  ineligible: "Not eligible", brand_declined: "Not selected", rejected: "Not selected", dropped: "Dropped",
};

/**
 * /creater/discover/[id] — campaign ka brief (Supabase) + Apply.
 * Apply = purane applyToCampaign: eligibility check → (ek se zyada profile ho to chuno) → apply_to_campaign_v2.
 * Instagram/WhatsApp connect nahi → Connect Instagram sheet.
 */
export default function CampaignBrief() {
  const { id } = useParams();
  const router = useRouter();
  const [s] = useSession();
  const gate = useJoinGate();
  const locked = gate.locked;
  const covers = useCovers();
  const { loading, list, error, reload } = useOpenCampaigns({ publicList: locked, skip: gate.loading });
  const x = useMemo(() => list.find((r) => String(r.campaign_id) === String(id)), [list, id]);

  const [why, setWhy] = useState(null); // eligibility jab not eligible
  const [briefOpen, setBriefOpen] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState(null); // { profiles, value }
  const [appliedAs, setAppliedAs] = useState(null);

  const sk = getSidekick(s.sidekick);
  useEffect(() => setWhy(null), [id]);

  if (gate.loading || loading)
    return (
      <BountyShell>
        <p className="cb-msg">Loading brief…</p>
        <style>{`.cb-msg { margin: 40px auto; text-align: center; font-size: 14px; color: #3e4b52; }`}</style>
      </BountyShell>
    );
  if (error || !x)
    return (
      <BountyShell>
        <Link href="/creater/discover" className="cb-back0">
          <ArrowLeft size={13} /> Back to campaigns
        </Link>
        <p className="cb-msg">
          {error ? (
            <>
              Couldn&apos;t load this campaign — {errText(error)}{" "}
              <button type="button" onClick={() => reload()}>
                Retry
              </button>
            </>
          ) : (
            "This campaign isn't open any more."
          )}
        </p>
        <style>{`.cb-msg { margin: 40px auto; text-align: center; font-size: 14px; color: #3e4b52; } .cb-msg button { border: 0; background: none; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; } .cb-back0 { display: inline-flex; align-items: center; gap: 6px; margin: 10px 0; font-size: 14px; font-weight: 700; color: #14231a; }`}</style>
      </BountyShell>
    );

  const k = kindOf(x);
  const noProd = k === "paid";
  const t = x.terms || {};
  const b = x.video_brief || {};
  const who = whoList(x);
  const el = x.eligibility || null;
  const stage = x.my_stage;
  const applied = !!stage || !!appliedAs;
  const tags = [].concat(x.hashtags || [], (x.mentions || []).map((m) => (String(m).charAt(0) === "@" ? m : "@" + m)));
  const deadline = t.content_days ? `${t.content_days} days after ${noProd ? "the brief" : "delivery"}` : x.ends_on ? `Till ${fdate(x.ends_on)}` : "Shown in your agreement";
  const usage = t.ad_rights_months ? `${t.ad_rights_months} month${t.ad_rights_months > 1 ? "s" : ""}` : "None";

  // ---------- Apply ----------
  const doApply = async (profile) => {
    setBusy(true);
    setErr("");
    const r = await applyTo(x.campaign_id, profile);
    setBusy(false);
    if (r.notEligible) return setWhy(r.notEligible);
    if (r.error) return setErr(r.error);
    setPick(null);
    setAppliedAs(profile || "");
    reload();
  };
  const startApply = async () => {
    if (locked) return setSheet(true);
    setBusy(true);
    setErr("");
    // har criteria pehle check (purane jaisa)
    const e = await checkEligibility(x.campaign_id, el);
    if (e && e.eligible === false) {
      setBusy(false);
      return setWhy(e);
    }
    const profs = await myApplyProfiles();
    setBusy(false);
    // ek se zyada profile → chuno; ek hi ho to wahi
    if (profs.length > 1) return setPick({ profiles: profs, value: profs[0].handle });
    return doApply(profs[0] ? profs[0].handle : null);
  };

  const notOk = why ? (why.criteria || []).filter((c) => !c.ok) : [];
  const fixable = notOk.some((c) => /not in your profile|not set in your profile|no city|no categories|not connected/i.test(c.have || ""));
  const line = (label, v) => {
    v = codeFill(x, v);
    return v ? (
      <>
        <p className="cb-k">{label}</p>
        <p className="cb-v cb-pre">{v}</p>
      </>
    ) : null;
  };

  return (
    <BountyShell>
      <title>{`${x.name || "Campaign"} — Bounty`}</title>

      <div className="cb">
        {/* ---------- Left: details ---------- */}
        <section className="cb-left">
          <Link href="/creater/discover" className="cb-back">
            <ArrowLeft size={13} /> Back to campaigns
          </Link>
          <div className="cb-img">
            <img src={coverOf(x, covers)} alt="" />
            <span className="cb-type">{TYPE_LABEL[typeKey(x)]}</span>
          </div>
          <h1 className="cb-title">{x.name || "Campaign"}</h1>
          <p className="cb-brand">{x.brand}</p>

          <div className="cb-grid">
            <div className="cb-box">
              <Gift size={16} />
              <span>
                <strong>{compLine(x)}</strong>
                <small>{compSub(x)}</small>
              </span>
            </div>
            <div className="cb-box">
              <Film size={16} />
              <span>
                <strong>{delivLine(x)}</strong>
                <small>Submit draft for approval</small>
              </span>
            </div>
            <div className="cb-box cb-box--wide">
              <Users size={15} />
              <span>
                <b>Who can apply:</b> {who.length ? who.join(" • ") : "Open to every creator"}
              </span>
            </div>
            <div className="cb-box">
              <Calendar size={15} />
              <span>
                <b>Deadline:</b>
                <small>{deadline}</small>
              </span>
            </div>
            <div className="cb-box">
              <ShieldCheck size={15} />
              <span>
                <b>Usage rights:</b>
                <small>{usage}</small>
              </span>
            </div>
            <div className="cb-box">
              <Megaphone size={15} />
              <span>
                <b>Collab post:</b>
                <small>{t.collab_rights ? "Required" : "Not required"}</small>
              </span>
            </div>
            <div className="cb-box">
              <Lock size={15} />
              <span>
                <b>Exclusivity:</b>
                <small>{t.exclusivity || "None"}</small>
              </span>
            </div>
          </div>

          <ol className="cb-journey">
            {APPLY_JOURNEY.map((j, i) => (
              <li key={j}>
                <span>{JOURNEY_ICONS[i]}</span>
                {j}
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Right: apply + brief ---------- */}
        <section className="cb-right">
          <div className="cb-cta">
            {locked ? (
              <>
                <button type="button" className="bx-btn bx-btn--sky bx-btn--lg bx-btn--block" onClick={() => setSheet(true)}>
                  Apply to campaign →
                </button>
                <p>We’ll ask for Instagram only when you apply.</p>
              </>
            ) : applied ? (
              <>
                <div className="cb-done">✓ {stage ? STAGE[stage] || "Applied" : `Applied${appliedAs ? " as @" + appliedAs : ""}`}</div>
                <p>
                  {x.my_participation_id ? (
                    <Link href={`/creater/my-campaigns/${x.my_participation_id}`}>Track it in My campaigns →</Link>
                  ) : (
                    <Link href="/creater/my-campaigns">Track it in My campaigns →</Link>
                  )}
                </p>
              </>
            ) : x.applications_closed ? (
              <>
                <div className="cb-done cb-done--off">🔒 Applications closed</div>
                <p>The brand has picked its creators. <Link href="/creater/discover">Find campaigns that fit you →</Link></p>
              </>
            ) : pick ? (
              <>
                <div className="cb-pick" role="radiogroup" aria-label="Apply with">
                  <p className="cb-pick__h">Pick the profile you want to apply with — the brand reviews this one.</p>
                  {pick.profiles.map((p) => (
                    <label key={p.handle} className={pick.value === p.handle ? "is-on" : ""}>
                      <input type="radio" name="cb-pick" checked={pick.value === p.handle} onChange={() => setPick({ ...pick, value: p.handle })} />
                      <span>
                        <b>@{p.handle}</b>
                        <small>
                          {p.label}
                          {p.followers != null ? ` · ${Number(p.followers).toLocaleString("en-IN")} followers` : ""}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <button type="button" className="bx-btn bx-btn--sky bx-btn--lg bx-btn--block" disabled={busy} onClick={() => doApply(pick.value)}>
                  {busy ? "Applying…" : "Apply →"}
                </button>
                <p>
                  <button type="button" className="cb-linkbtn" onClick={() => setPick(null)}>
                    Cancel
                  </button>
                </p>
              </>
            ) : why || (el && el.eligible === false) ? (
              <>
                <button type="button" className="bx-btn bx-btn--cream bx-btn--lg bx-btn--block" onClick={() => setWhy(why ? null : el)} aria-expanded={!!why}>
                  Not eligible — see why
                </button>
                {why ? (
                  <div className="cb-why">
                    <p>The brand requires the criteria below. Your profile doesn&apos;t match {notOk.length === 1 ? "this one" : "these"}:</p>
                    <ul>
                      {notOk.map((c) => (
                        <li key={c.key || c.need}>
                          ✗ <b>{c.need}</b>
                          <br />
                          <small>{c.have}</small>
                        </li>
                      ))}
                    </ul>
                    {fixable ? (
                      <p>
                        Some details are just missing from your profile — <Link href="/creater/profile">update your profile</Link> and check again.
                      </p>
                    ) : (
                      <p>
                        <Link href="/creater/discover">Find campaigns that fit you →</Link>
                      </p>
                    )}
                  </div>
                ) : (
                  <p>You review and accept terms if selected.</p>
                )}
              </>
            ) : (
              <>
                <button type="button" className="bx-btn bx-btn--sky bx-btn--lg bx-btn--block" disabled={busy} onClick={startApply}>
                  {busy ? "Checking…" : "Apply to campaign →"}
                </button>
                <p>You review and accept terms if selected.</p>
              </>
            )}
            {err && <p className="cb-err">{err}</p>}
          </div>

          <div className="bx-card cb-brief">
            <button type="button" className="cb-brief__head" onClick={() => setBriefOpen(!briefOpen)} aria-expanded={briefOpen}>
              <FileText size={15} /> Read full creative brief
              <ChevronDown size={15} />
            </button>
            {briefOpen && (
              <div className="cb-brief__body">
                {line("Brief", x.brief)}
                {line("What to shoot", b.what_to_shoot)}
                {line("Key messages", b.key_messages)}
                {line("Do's", b.dos)}
                {line("Don'ts", b.donts)}
                {line("Caption to use", b.caption)}
                {tags.length > 0 && (
                  <>
                    <p className="cb-k">Must include in caption</p>
                    <p className="cb-v">{tags.join(" ")}</p>
                  </>
                )}
                <p className="cb-k">Deliverables</p>
                <p className="cb-v cb-pre">{x.deliverables_text || delivLine(x)}</p>
                {x.product_link && (
                  <p className="cb-v">
                    <a href={safeLink(x.product_link)} target="_blank" rel="noopener noreferrer">
                      View product ↗
                    </a>
                  </p>
                )}
                {(x.attachments || []).length > 0 && (
                  <>
                    <p className="cb-k">Files</p>
                    {(x.attachments || []).map((a, i) => (
                      <p key={i} className="cb-v">
                        <a href={safeLink(a.url)} target="_blank" rel="noopener noreferrer">
                          📎 {a.name || "file"}
                        </a>
                      </p>
                    ))}
                  </>
                )}
                <p className="cb-terms">ⓘ Terms &amp; disclosure</p>
                <ul>
                  {t.content_days && (
                    <li>
                      Post within <b>{t.content_days} days</b> of {noProd ? "getting the video brief" : "receiving the product"}
                    </li>
                  )}
                  <li>
                    Submit your video in the app first — post <b>only after the brand approves it</b>
                  </li>
                  {t.ad_rights_months && (
                    <li>
                      Ad rights: the brand may use your content for <b>{usage}</b>
                    </li>
                  )}
                  {t.collab_rights && (
                    <li>
                      Add the brand as an Instagram <b>collaborator</b> on the post
                    </li>
                  )}
                  {k && k !== "barter" && (
                    <li>
                      <b>Paid:</b> your fee is written into your own agreement
                    </li>
                  )}
                  {t.blacklist_clause && (
                    <li>
                      Not delivering after you {noProd ? "sign" : "receive the product"} blocks your account
                      {t.reship_clause && !noProd ? " and you must re-ship the product" : ""}
                    </li>
                  )}
                  <li>Disclose the collaboration (Paid partnership / #ad) as per ASCI</li>
                </ul>
                {(x.cities || []).length > 0 && (
                  <>
                    <p className="cb-k">Cities</p>
                    <p className="cb-v">{x.cities.join(", ")}</p>
                  </>
                )}
                {(x.languages || []).length > 0 && (
                  <>
                    <p className="cb-k">Languages</p>
                    <p className="cb-v">{x.languages.join(", ")}</p>
                  </>
                )}
                {line("Posting note", b.posting_note)}
              </div>
            )}
          </div>

          <RumiTip className="cb-rumi" name={sk.name} img={sk.img} text="The deadline starts after delivery — read the brief first." />
        </section>
      </div>

      <ConnectInstagramSheet open={sheet} onClose={() => setSheet(false)} />

      <style>{`
        .cb { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 22px; align-items: start; }
        .cb-left { padding: 0; }
        .cb-back { display: inline-flex; align-items: center; gap: 6px; margin: 10px 0 10px; font-size: 14px; font-weight: 700; color: #14231a; }
        .cb-back:hover { color: #b8401f; }
        .cb-img { position: relative; height: 185px; border-radius: 4px; overflow: hidden; }
        .cb-img img { width: 100%; height: 100%; object-fit: cover; }
        .cb-type { position: absolute; left: 0; bottom: 12px; padding: 4px 10px; border-radius: 0 999px 999px 0; background: rgba(20,35,26,.9); border: 1px solid #3fd9e8; border-left: 0; color: #3fd9e8; font-family: var(--bx-jak); font-size: 10px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; }
        .cb-title { margin-top: 18px; text-align: center; font-family: var(--bx-serif); font-size: 30px; font-weight: 600; line-height: 1.2; color: #14231a; }
        .cb-brand { margin: 2px 0 18px; text-align: center; font-family: var(--bx-serif); font-size: 15px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase; color: #3e4b52; }
        .cb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cb-box { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: #f3e4c3; border: 1px solid #e2d0a8; font-size: 12px; line-height: 1.4; color: #4a4436; }
        .cb-box svg { flex-shrink: 0; margin-top: 2px; color: #c0702a; }
        .cb-box strong { display: block; font-family: var(--bx-serif); font-size: 15px; font-weight: 600; line-height: 1.2; color: #14231a; }
        .cb-box small { display: block; font-size: 12px; color: #4a4436; }
        .cb-box b { font-size: 13px; font-weight: 700; color: #14231a; }
        .cb-box--wide { grid-column: 1 / -1; }
        .cb-journey { list-style: none; margin: 20px 0 0; padding: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; text-align: center; font-size: 11.5px; font-weight: 500; color: #14231a; }
        .cb-journey span { display: grid; place-items: center; width: 36px; height: 36px; margin: 0 auto 5px; border-radius: 50%; border: 1px solid var(--bx-line); background: #fffaf0; font-size: 14px; }

        .cb-right { display: grid; gap: 14px; position: sticky; top: 90px; }
        .cb-cta { margin-top: 74px; padding: 14px 14px 12px; border-radius: 14px; background: #3d2f22; color: var(--bx-cream); text-align: center; }
        .cb-cta .bx-btn { height: 56px; font-family: var(--bx-jak); font-size: 19px; font-weight: 800; letter-spacing: -0.1px; color: #0b2530; }
        .cb-cta p { margin: 12px 0 0; font-size: 12px; font-weight: 500; color: #fbf3e2; line-height: 1.5; }
        .cb-cta a { color: var(--bx-gold-2); font-weight: 700; text-decoration: underline; }
        .cb-pre { white-space: pre-wrap; }
        .cb-brief a { font-weight: 700; color: #2e9c94; }
        .cb-err { color: #ffd3c4 !important; }
        .cb-done--off { background: #f8dcd2 !important; color: #b8401f !important; }
        .cb-linkbtn { border: 0; background: none; padding: 0; font: inherit; font-weight: 700; color: var(--bx-gold-2); text-decoration: underline; cursor: pointer; }
        .cb-why { margin-top: 12px; text-align: left; }
        .cb-why p { margin: 0 0 8px !important; }
        .cb-why ul { margin: 0 0 8px; padding: 0; list-style: none; display: grid; gap: 6px; }
        .cb-why li { padding: 8px 10px; border-radius: 10px; background: rgba(255,211,196,.12); font-size: 12.5px; color: #ffd3c4; line-height: 1.4; }
        .cb-why li b { color: #fbf3e2; }
        .cb-why small { color: #e9cdbd; }
        .cb-pick { display: grid; gap: 8px; margin-bottom: 12px; text-align: left; }
        .cb-pick__h { margin: 0 !important; }
        .cb-pick label { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(251,243,226,.25); cursor: pointer; }
        .cb-pick label.is-on { border-color: #3fd9e8; background: rgba(63,217,232,.08); }
        .cb-pick input { margin-top: 3px; accent-color: #3fd9e8; }
        .cb-pick b { display: block; font-size: 14px; color: #fbf3e2; }
        .cb-pick small { font-size: 12px; color: #d9cdb2; }
        .cb-done { height: 50px; border-radius: 999px; background: var(--bx-ok-bg); color: var(--bx-ok); display: grid; place-items: center; font-size: 16px; font-weight: 800; }

        .cb-brief { padding: 2px 14px 14px; border-radius: 12px; background: #f6e8c9; border: 1px solid #e2d3b0; box-shadow: none; }
        .cb-brief__head { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 0; border: 0; background: none; font-family: var(--bx-serif); font-size: 16px; font-weight: 600; text-align: left; color: #14231a; }
        .cb-brief__head svg:last-child { margin-left: auto; transition: transform .2s; }
        .cb-brief__head[aria-expanded="true"] svg:last-child { transform: rotate(180deg); }
        .cb-brief__body { padding-bottom: 4px; }
        .cb-v { margin: 0; font-size: 13.5px; color: #14231a; }
        .cb-terms { margin: 12px 0 6px; font-size: 13px; font-weight: 500; color: #14231a; }
        .cb-brief li { margin-bottom: 4px; }
        .cb-brief li b { font-weight: 700; }
        .cb-k { margin: 10px 0 4px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8a6b32; }
        .cb-brief ul { margin: 0; padding-left: 17px; font-size: 13px; line-height: 1.5; color: #14231a; }
        .cb-brief__more { display: inline-flex; align-items: center; gap: 4px; margin-top: 6px; border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 700; color: var(--bx-teal); }
        .cb-rumi { justify-content: center; }

        @media (max-width: 1023px) {
          .cb { grid-template-columns: minmax(0, 1fr); }
          .cb-right { position: static; }
          .cb-cta { margin-top: 0; }
        }
        @media (max-width: 767px) {
          .cb-cta { margin-top: 0; }
          .cb-cta .bx-btn { font-size: 16px; }
          .cb-back { font-family: var(--bx-jak); font-size: 13px; margin-top: 4px; }
          .cb-img { height: 200px; margin: 0 -16px; border-radius: 0; }
          .cb-title { font-size: 26px; }
          .cb-journey { font-size: 10.5px; font-weight: 600; }
          .cb-title { font-size: 26px; }
          .cb-journey span { width: 32px; height: 32px; }
        }
      `}</style>
    </BountyShell>
  );
}
