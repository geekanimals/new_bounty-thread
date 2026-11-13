"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Note, useToast, inr } from "@/components/admin/campaign2/kit";
import { rpc, invoke, errText } from "@/lib/supabase";
import { UploadCard, MsgOff, loadUpload, saveUpload, rowData, rowBlock, sheetLine, statusesFor, stRank, stLabel, stMsg, dispStatus, useUploadKind } from "@/components/admin/campaign2/upload";

/*
 * Bulk upload · step 3 — purane bkCheck / bulkHtml / bkUpload jaisa:
 *  api.bulk_preview + api.bulk_existing (har row: naya / Geek OS par / pehle se campaign mein / galat number …)
 *  ig-discover lookup (40 handles tak — asli naam + followers)
 *  Upload: api.bulk_stage_payments (paid) → api.bulk_import_creators → api.bulk_log_skipped → api.track_codes_bulk (coupon)
 */
const ph = (d) => String(d.phone || "").replace(/\D/g, "").slice(-10);
const em = (d) => String(d.email || "").trim().toLowerCase();
const hd = (d) =>
  String(d.handle || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^(https?:\/\/)?(www\.|m\.)?instagram\.com\//, "")
    .replace(/[/?#].*$/, "");
const same = (a, b) => !!a && !!b && ((a.phone && a.phone === b.phone) || (a.email && a.email === b.email) || (a.handle && a.handle === b.handle));
// ek hi number / email par alag Instagram → ek creator ke aur accounts (purane bkFlagConflicts)
function flagConflicts(data, pv) {
  data.forEach((b, j) => {
    const p = pv[j];
    if (!p) return;
    const i = data.findIndex((a, k) => k < j && pv[k] && !pv[k].multi && ((ph(a).length === 10 && ph(a) === ph(b)) || (em(a) && em(a) === em(b))) && hd(a) && hd(b) && hd(a) !== hd(b));
    if (i < 0) return;
    const by = ph(data[i]).length === 10 && ph(data[i]) === ph(b) ? "WhatsApp number" : "email";
    p.duplicate = true;
    p._dupOf = i;
    p.multi = { by, handle: hd(b), row: i };
    const q = pv[i];
    q.more = q.more || [];
    if (!q.more.includes(hd(b))) q.more.push(hd(b));
  });
}
// ek hi insaan kai rows mein → pehli row mein sab jodo (purane bkMergeRepeats)
function mergeRepeats(all, pv) {
  pv.forEach((p, i) => {
    if (!p || !p.duplicate) return;
    const j = p._dupOf != null ? p._dupOf : pv.findIndex((q, k) => k < i && q && !q.duplicate && same(q, p));
    if (j < 0) return;
    p._dupOf = j;
    const a = all[j],
      b = all[i];
    if (stRank(b.status) > stRank(a.status)) {
      a.status = b.status;
      a.approved = b.approved;
    }
    a.post_link = [...new Set([a.post_link, b.post_link].join(" ").split(/\s+/).filter(Boolean))].join(" ");
    if (p.multi) {
      a.extra = { ...(a.extra || {}) };
      a.extra.other_instagram = [...new Set([...(a.extra.other_instagram || []), p.multi.handle])];
    }
    ["video_link", "courier", "tracking", "address", "state", "pincode", "city", "email", "phone", "handle", "name"].forEach((k) => {
      if (!a[k] && b[k]) a[k] = b[k];
    });
    a._merged = true;
  });
}
// sheet aur Geek OS mein alag details → Figma mein chunne ka UI nahi, isliye Geek OS wala rakho (sheet ka value nahi bhejte)
const DIFF = [["addr", ["address", "city", "state", "pincode"]], ["ship", ["courier", "tracking"]], ["video", ["video_link"]]];
const norm = (v) => String(v || "").toLowerCase().replace(/https?:\/\/(www\.)?/, "").replace(/[^a-z0-9]+/g, "");
function keepSite(d, ex, kind) {
  const v = (ex && ex.vals) || {};
  let n = 0;
  DIFF.forEach(([g, ks]) => {
    if (kind === "paid" && g !== "video") return;
    const site = (k) => (k === "video_link" ? v.video : v[k]);
    if (ks.some((k) => String(d[k] || "").trim() && site(k) && norm(d[k]) !== norm(site(k)) && !(k === "pincode" && norm(site(k)) && norm(d.address).includes(norm(site(k)))))) {
      ks.forEach((k) => (d[k] = ""));
      n++;
    }
  });
  return n;
}

export default function BulkUploadCheck() {
  const { id } = useParams();
  const router = useRouter();
  const base = `/vault/campaigns/${id}/upload`;
  const kind = useUploadKind(id);
  const [toast, show] = useToast();
  const [up, setUp] = useState(null);
  const [none, setNone] = useState(false);
  const [pv, setPv] = useState(null); // bulk_preview (array) ya { error }
  const [ex, setEx] = useState([]); // bulk_existing
  const [msg, setMsg] = useState("");
  const [all, setAll] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const seq = useRef(0);
  const steps = statusesFor(kind);

  useEffect(() => {
    const u = loadUpload(id);
    if (u && u.rows) {
      setUp(u);
      setMsg(u.note || "");
    } else setNone(true);
  }, [id]);

  // har baar rows / status badle → preview dobara (purane bkCheck jaisa)
  const statusKey = up ? up.rows.map((r) => r.status).join("|") : "";
  useEffect(() => {
    if (!up || !id || id === "sample") return;
    const my = ++seq.current;
    const payload = up.rows.map((r) => rowData(up, r, kind));
    (async () => {
      const [a, b] = await Promise.all([rpc("admin", "api.bulk_preview", { p_campaign: id, p_rows: payload }), rpc("admin", "api.bulk_existing", { p_campaign: id, p_rows: payload })]);
      if (my !== seq.current) return;
      const exl = b && Array.isArray(b.data) ? b.data : [];
      setEx(exl);
      if (a.error) return setPv({ error: errText(a.error) });
      const p = (a.data || []).map((x) => ({ ...(x || {}) }));
      flagConflicts(payload, p);
      setPv(p);
      // Instagram se asli naam + followers (40 handles tak, 3 ek saath)
      const todo = [...new Set(p.filter((x) => x.handle && !(x.ig && (x.ig.followers || x.ig.name)) && !x.ig_missing).map((x) => x.handle))].slice(0, 40);
      let k = 0;
      const worker = async () => {
        while (k < todo.length) {
          const h = todo[k++];
          const r = await invoke("admin", "ig-discover", { action: "lookup", username: h, media_limit: 6 }).catch(() => ({}));
          if (my !== seq.current) return;
          const pr = r && r.data && r.data.profile;
          setPv((cur) =>
            Array.isArray(cur)
              ? cur.map((x) =>
                  x && x.handle === h
                    ? pr && (pr.followers != null || pr.name)
                      ? { ...x, ig: { name: pr.name || "", followers: pr.followers, fresh: true } }
                      : r && r.data && r.data.error && !r.data.needs_permission
                        ? { ...x, ig_missing: true }
                        : x
                    : x
                )
              : cur
          );
        }
      };
      await Promise.all([worker(), worker(), worker()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [up && up.src, up && up.rows.length, statusKey, id, kind]);

  const setStatus = (i, s) => {
    const nu = { ...up, rows: up.rows.map((r, j) => (j === i ? { ...r, status: s, picked: true } : r)) };
    setUp(nu);
    saveUpload(id, nu);
  };
  const setEveryone = (s) => {
    setAll(s);
    if (!s) return;
    const nu = { ...up, rows: up.rows.map((r) => ({ ...r, status: s, picked: true })) };
    setUp(nu);
    saveUpload(id, nu);
  };

  if (none || !up)
    return (
      <AdminShell>
        <WorkspaceHead id={id} />
        <UploadCard id={id} step={3}>
          {none ? (
            <Note tone="amber" icon="📄">
              <b>No sheet loaded yet</b>— <Link href={base}><u>choose a file or paste a Google Sheet link</u></Link> first.
            </Note>
          ) : (
            <div className="c2-skel" style={{ height: 120 }} />
          )}
        </UploadCard>
      </AdminShell>
    );

  const P = Array.isArray(pv) ? pv : [];
  const data = up.rows.map((r) => rowData(up, r, kind));
  const block = up.rows.map((r, i) => rowBlock(up, r, P[i], ex[i], kind));
  const skipOf = (i) => !!block[i] || (P[i] && (P[i].duplicate || P[i].already));
  const okIdx = up.rows.map((_, i) => i).filter((i) => !skipOf(i));
  const badIdx = up.rows.map((_, i) => i).filter((i) => block[i]);
  const counts = okIdx.reduce((m, i) => {
    const k = stLabel(up.rows[i].status).toLowerCase();
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});
  const hasContact = ["phone", "email", "handle"].some((k) => up.map[k] != null);
  const ready = Array.isArray(pv);

  // "What happens" (purane bkWhat jaisa)
  const what = (i) => {
    const p = P[i],
      r = up.rows[i],
      st = r.status || "registered";
    if (!p) return { main: "…" };
    if (p.multi) return { main: `📸 Same ${p.multi.by} as row ${sheetLine(up, p.multi.row)} — @${p.multi.handle} is added to that creator as another Instagram`, good: true };
    if (p.duplicate) return { main: `Same Instagram / number as row ${sheetLine(up, p._dupOf != null ? p._dupOf : 0)} — merged into that row` };
    if (p.already) return { main: `Already in${p.live_stage ? ` · ${String(p.live_stage).replace(/_/g, " ")}` : ""} — nothing new in this row · skipped` };
    const main = p.on_platform ? (p.stage ? `Already in · ${String(p.stage).replace(/_/g, " ")} → ${stLabel(st)}` : `On Geek OS${p.who ? ` · ${p.who}` : ""} — added now → ${stLabel(st)}`) : `New — joins on ${stLabel(st)} after sign-up`;
    const m0 = stMsg(st);
    const m = m0 === "no message" && !p.on_platform && stRank(st) >= 4 ? "Invite (geek_campaign_access)" : m0;
    const via = [p.phone ? "WhatsApp" : null, p.email ? "email" : null].filter(Boolean).join(" + ");
    const warn = [p.phone_bad && "number looks wrong", p.email_bad && "email looks wrong"].filter(Boolean).join(" · ");
    const ig = p.ig && (p.ig.followers || p.ig.name) ? `📸 ${p.ig.name ? p.ig.name + " · " : ""}${p.ig.followers ? Number(p.ig.followers).toLocaleString("en-IN") + " followers" : ""}` : p.handle && p.ig_missing ? `📸 @${p.handle} — Instagram didn't return this profile; check the handle` : "";
    return { main, good: p.on_platform && !p.stage, sends: m === "no message" ? "✉️ no message for this step" : `✉️ sends: ${m}${via ? ` on ${via}` : ""}`, warn, ig };
  };

  // ⬆ Upload & invite — purane bkUpload ka hi kram
  const upload = async () => {
    if (!ready || busy) return;
    const rows0 = up.rows.map((r) => rowData(up, r, kind));
    let kept = 0;
    rows0.forEach((d, i) => (kept += keepSite(d, ex[i], kind)));
    mergeRepeats(rows0, P);
    const why = up.rows.map((r, i) => block[i] || (P[i] && P[i].already && !rows0[i]._merged ? "Already in this campaign — nothing new in the row" : null));
    up.rows.forEach((r, i) => {
      if (!why[i] && P[i] && P[i].duplicate) why[i] = P[i].multi ? `Same ${P[i].multi.by} as row ${sheetLine(up, P[i].multi.row)} — @${P[i].multi.handle} added to that creator as another Instagram` : `Repeat of row ${sheetLine(up, P[i]._dupOf != null ? P[i]._dupOf : 0)} — same person, merged into that row`;
    });
    const rows = rows0.filter((d, i) => !why[i] && !(P[i] && (P[i].duplicate || (P[i].already && !d._merged))));
    const notUp = up.rows
      .map((r, i) => {
        if (!why[i]) return null;
        const x = rowData(up, r, kind);
        return { row: sheetLine(up, i), name: x.name, handle: x.handle, phone: x.phone, email: x.email, status: r.status || "registered", reason: why[i] };
      })
      .filter(Boolean);
    if (!rows.length) return show("Nothing new to upload — fix the rows above first");
    setBusy(true);
    setErr("");
    const notes = [];
    // paid: har row ki fee / bank / UPI pehle (creator aate hi lag jaati hai)
    const payRows = rows0.map((d, i) => ({ ...d, i: String(i + 2) })).filter((d) => d.fee || d.upi || d.account_no);
    if (payRows.length && kind !== "barter") {
      const st = await rpc("admin", "api.bulk_stage_payments", { p_campaign: id, p_rows: payRows });
      if (st.error) {
        setBusy(false);
        return setErr("Payment columns: " + errText(st.error));
      }
      const bad = (st.data && st.data.errors) || [];
      if (bad.length) notes.push("Some payment details were not used: " + bad.slice(0, 10).map((x) => `Row ${x.row}: ${x.error}`).join(" · "));
    }
    const { data: d0, error } = await rpc("admin", "api.bulk_import_creators", { p_campaign: id, p_rows: rows, p_note: msg.trim() || null });
    if (error) {
      setBusy(false);
      return setErr(errText(error));
    }
    const d = d0 || {};
    if (notUp.length && d.batch_id) await rpc("admin", "api.bulk_log_skipped", { p_campaign: id, p_batch: d.batch_id, p_rows: notUp });
    const codes = rows.filter((x) => x.coupon && x.handle).map((x) => ({ handle: String(x.handle).replace(/^@/, ""), code: x.coupon }));
    if (codes.length) {
      const cr = await rpc("admin", "api.track_codes_bulk", { p_campaign: id, p_rows: codes, p_overwrite: true });
      notes.push(cr.error ? `🎟️ Codes not saved: ${errText(cr.error)}` : `🎟️ ${(cr.data && cr.data.set) || 0} coupon code${((cr.data && cr.data.set) || 0) !== 1 ? "s" : ""} saved${cr.data && cr.data.skipped ? ` · ${cr.data.skipped} not matched` : ""}`);
    }
    if (kept) notes.push(`🔀 ${kept} detail${kept > 1 ? "s" : ""} differed from Geek OS — Geek OS kept`);
    const held = [d.posted_without_link ? `${d.posted_without_link} without the post link` : "", d.without_video ? `${d.without_video} without the video link` : "", d.without_courier ? `${d.without_courier} without courier + tracking` : ""].filter(Boolean);
    if (held.length) notes.push(`⚠️ Some rows were put one step back: ${held.join(" · ")}`);
    saveUpload(id, {
      src: up.src,
      done: true,
      result: d,
      notes,
      uploaded: rows.map((x) => ({ name: x.name, handle: x.handle, status: dispStatus(kind, x.status) })),
      skipped: notUp,
    });
    setBusy(false);
    router.push(`${base}/done`);
  };

  const toneOf = (s) => (stRank(s) >= 7 && stRank(s) <= 9 ? "orange" : "violet");
  const fee = (d) => [d.fee ? inr(d.fee) + (d.advance_pct ? ` · ${d.advance_pct}% adv` : "") : "", d.upi || (d.account_no ? `A/c ${String(d.account_no).slice(-4)}${d.ifsc ? " · " + d.ifsc : ""}` : "")].filter(Boolean).join(" · ") || "—";

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <UploadCard id={id} step={3}>
        <Note tone="green" icon="✅">
          <b>
            {up.rows.length} row{up.rows.length !== 1 ? "s" : ""} loaded
          </b>
          from {up.src} · ✎{" "}
          <Link href={`${base}/match`}>
            <u>Change sheet / columns · guide</u>
          </Link>
        </Note>
        <MsgOff id={id} />
        {!hasContact && (
          <Note tone="red" icon="⛔">
            <b>This sheet isn’t in the format</b>— no WhatsApp, Email or Instagram column was found. Match the columns under ✎ Change sheet / columns.
          </Note>
        )}
        {pv && pv.error && (
          <Note tone="red" icon="⚠️">
            <b>Couldn’t check the rows</b>— {pv.error}
          </Note>
        )}
        {badIdx.length > 0 && (
          <Note tone="red" icon="⛔">
            <b>
              {badIdx.length} row{badIdx.length > 1 ? "s" : ""} won’t be uploaded
            </b>
            — fix them in the sheet and load it again (or change the step in the row):{" "}
            {badIdx
              .slice(0, 12)
              .map((i) => `Row ${sheetLine(up, i)} · ${data[i].name || data[i].handle || "—"} — ${block[i]}`)
              .join(" · ")}
            {badIdx.length > 12 ? ` · +${badIdx.length - 12} more` : ""}.
          </Note>
        )}

        <div className="uc-all">
          <span>Set everyone to</span>
          <select className="ga-input" value={all} onChange={(e) => setEveryone(e.target.value)} aria-label="Set everyone to">
            <option value="">— choose —</option>
            {steps.map(([k, l], n) => (
              <option key={k} value={k}>
                {n + 1}. {l}
              </option>
            ))}
          </select>
          <span>— or change each row below</span>
        </div>
        <p className="uc-info">
          ℹ️ Each row only needs the columns of its own Status —{kind !== "paid" ? " Address confirmed: Address, City, State, PIN · Courier sent / delivered: Courier + Tracking ·" : ""} Video submitted / Client approved: Video link · Posted / Done: Post link.
        </p>

        <div className="c2-tw">
          <table className="c2-t uc-t">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Instagram</th>
                <th>WhatsApp</th>
                <th>Email</th>
                <th>City</th>
                <th>Address · Courier</th>
                <th>
                  💰 Fee · Pay
                  <br />
                  to
                </th>
                <th>What happens</th>
              </tr>
            </thead>
            <tbody>
              {up.rows.map((r, i) => {
                const d = data[i],
                  w = ready ? what(i) : { main: "Checking…" },
                  n = steps.findIndex((s) => s[0] === r.status);
                return (
                  <tr key={i} className={block[i] ? "is-bad" : ""}>
                    <td>
                      <label className={`uc-st uc-st--${toneOf(r.status)}`}>
                        <span>
                          {n + 1}. {stLabel(r.status)} ·
                        </span>
                        <select value={r.status} onChange={(e) => setStatus(i, e.target.value)} aria-label={`Status for ${d.name || "row " + sheetLine(up, i)}`}>
                          {steps.map(([k, l], j) => (
                            <option key={k} value={k}>
                              {j + 1}. {l}
                            </option>
                          ))}
                        </select>
                      </label>
                    </td>
                    <td className="uc-w">
                      <b>{d.name || "—"}</b>
                    </td>
                    <td>{d.handle ? "@" + hd(d) : "—"}</td>
                    <td className="uc-w">{d.phone || "—"}</td>
                    <td>{d.email || "—"}</td>
                    <td>{d.city || "—"}</td>
                    <td className="uc-w uc-addr">{[d.address, d.pincode, [d.courier, d.tracking].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="uc-w uc-fee">{fee(d)}</td>
                    <td className="uc-w uc-what">
                      {block[i] ? (
                        <span className="uc-pill uc-pill--bad">⛔ Not uploaded — {block[i]}</span>
                      ) : (
                        <>
                          <span className={`uc-pill${w.good ? " uc-pill--good" : ""}`}>{w.main}</span>
                          {w.warn && <span className="uc-pill uc-pill--warn">{w.warn}</span>}
                          {w.sends && <small>{w.sends}</small>}
                          {w.ig && <small>{w.ig}</small>}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <label className="uc-msg">
          <span>Message to the creators (optional — goes with the invite)</span>
          <input className="ga-input" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="e.g. Diwali drop — we loved your recent reels!" />
        </label>
        {err && <p className="uc-err">{err}</p>}

        <div className="uc-act">
          <button type="button" className="ga-btn ga-btn--primary" onClick={upload} disabled={!ready || busy || !okIdx.length || !hasContact}>
            {busy ? "Uploading…" : `Upload & invite ${okIdx.length} creator${okIdx.length === 1 ? "" : "s"}`}
          </button>
          {badIdx.length > 0 && <b className="uc-bad">{badIdx.length} not uploaded (fix above)</b>}
          <span className="uc-sum">
            {Object.entries(counts)
              .map(([k, c]) => ` · ${c} ${k}`)
              .join("")}
          </span>
          <Link href={base} className="c2-tbtn">
            Clear
          </Link>
        </div>
      </UploadCard>
      {toast}

      <style>{`
        .up-card .c2-note + .c2-note { margin-top: 17px; }
        .uc-all { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: var(--ad-muted); }
        .uc-all select { width: 179px; height: 45px; padding: 0 12px; font-size: 14px; color: #293652; cursor: pointer; -webkit-appearance: none; appearance: none; }
        .uc-info { margin-top: 15px; font-size: 12px; line-height: 1.35; color: var(--ad-muted); }
        .uc-t { margin-top: 16px; }
        .uc-t th { vertical-align: bottom; line-height: 1.3; }
        .uc-t td { padding-top: 12px; padding-bottom: 12px; height: 72px; }
        .uc-t tr:first-child td { height: 119px; }
        .uc-t tr.is-bad td { background: #fdf1f2; }
        .uc-w { white-space: normal !important; min-width: 60px; line-height: 1.33; }
        .uc-t td.uc-w:nth-child(2) { width: 50px; }
        .uc-addr { min-width: 120px; max-width: 130px; }
        .uc-fee { min-width: 86px; max-width: 92px; }
        .uc-what { min-width: 190px; max-width: 210px; }
        .uc-st { position: relative; display: inline-flex; align-items: center; max-width: 94px; padding: 7px 11px; border-radius: 14px; font-size: 11px; font-weight: 700; line-height: 1.3; white-space: normal; cursor: pointer; }
        .uc-st--violet { background: var(--ad-lilac); color: #6857ec; }
        .uc-st--orange { background: var(--ad-orange-bg); color: var(--ad-orange); }
        .uc-st select { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
        .uc-pill { display: inline-block; padding: 6px 10px; border-radius: 14px; background: var(--ad-soft); color: #7a8398; font-size: 11px; font-weight: 700; line-height: 1.3; }
        .uc-pill--bad { background: var(--ad-red-bg); color: var(--ad-red); }
        .uc-pill--good { background: #e2f7ef; color: #0b9b6c; }
        .uc-pill--warn { margin-top: 4px; background: var(--ad-orange-bg); color: var(--ad-orange); }
        .uc-err { margin-top: 12px; font-size: 12px; color: #d4493f; }
        .uc-what small { display: block; margin-top: 2px; font-size: 12px; line-height: 1.33; color: var(--ad-muted); }
        .uc-msg { display: flex; align-items: center; gap: 0; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: var(--ad-muted); }
        .uc-msg .ga-input { width: 173px; height: 42px; }
        .uc-act { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
        .uc-act .ga-btn { height: 41px; }
        .uc-bad { font-size: 12px; font-weight: 700; color: #d6453d; }
        .uc-sum { font-size: 12px; color: var(--ad-muted); margin-right: 6px; }
        @media (max-width: 640px) {
          .uc-all select, .uc-msg .ga-input { width: 100%; }
          .uc-msg { gap: 6px; }
          .uc-act .ga-btn { width: 100%; }
        }
      `}</style>
    </AdminShell>
  );
}
