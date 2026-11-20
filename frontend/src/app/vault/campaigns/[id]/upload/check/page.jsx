"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import { Note, useToast, inr } from "@/components/admin/campaign2/kit";
import { rpc, invoke, errText } from "@/lib/supabase";
import { UploadCard, MsgOff, loadUpload, saveUpload, rowData, rowBlock, isPhoneLike, sheetLine, statusesFor, stRank, stLabel, stMsg, dispStatus, useUploadKind } from "@/components/admin/campaign2/upload";

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
// sheet aur Geek OS mein alag details → purane jaisa har row mein chuno: "Keep Geek OS" (default) ya "Use the sheet" (bulk_apply_choice)
const DIFF = [["addr", ["address", "city", "state", "pincode"]], ["ship", ["courier", "tracking"]], ["video", ["video_link"]]];
const DIFF_LABEL = { addr: "🏠 Address", ship: "🚚 Courier & tracking", video: "🎬 Video link" };
/** is row mein kaun se groups Geek OS se alag hain → [{ g, site, sheet }] */
function diffsOf(d, ex, kind) {
  const v = (ex && ex.vals) || {};
  const out = [];
  DIFF.forEach(([g, ks]) => {
    if ((kind === "paid" || kind === "visit") && g !== "video") return;
    const site = (k) => (k === "video_link" ? v.video : v[k]);
    if (ks.some((k) => String(d[k] || "").trim() && site(k) && norm(d[k]) !== norm(site(k)) && !(k === "pincode" && norm(site(k)) && norm(d.address).includes(norm(site(k))))))
      out.push({ g, site: ks.map(site).filter(Boolean).join(" · "), sheet: ks.map((k) => d[k]).filter(Boolean).join(" · ") });
  });
  return out;
}
const norm = (v) => String(v || "").toLowerCase().replace(/https?:\/\/(www\.)?/, "").replace(/[^a-z0-9]+/g, "");
function keepSite(d, ex, kind, pick = {}) {
  const v = (ex && ex.vals) || {};
  let n = 0;
  DIFF.forEach(([g, ks]) => {
    if ((kind === "paid" || kind === "visit") && g !== "video") return;
    if (pick[g] === "sheet") return;
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
  const [picks, setPicks] = useState({}); // { rowIndex: { addr: "sheet" | "site" } }
  const [msg, setMsg] = useState("");
  const [all, setAll] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [choice, setChoice] = useState({}); // { rowIndex: "skip" | "anyway" | "silent" }
  const [fixing, setFixing] = useState(null); // row index being fixed
  const [fixVals, setFixVals] = useState({});
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
  }, [up && up.src, up && up.rows.length, up && up.rev, statusKey, id, kind]);

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
  // row ki problems — error (upload nahi hogi) + warning (upload hogi, par kuch galat)
  const rawOf = (r, k) => (up.map[k] != null ? String(r.cells[up.map[k]] || "").trim() : "");
  const issues = up.rows.map((r, i) => {
    const out = [],
      d = data[i],
      p = P[i] || {};
    if (block[i]) out.push({ t: "error", m: block[i] });
    const rp = rawOf(r, "phone");
    if (rp && !isPhoneLike(rp)) out.push({ t: "warn", f: "phone", m: `WhatsApp “${rp.slice(0, 24)}” isn’t a mobile number${/[\/:]|^\d{5}(\.\d+)?$/.test(rp) ? " — looks like a date / time" : ""} · no WhatsApp will go` });
    else if (p.phone_bad) out.push({ t: "warn", f: "phone", m: `WhatsApp number “${d.phone}” looks wrong` });
    const re = rawOf(r, "email");
    if ((re && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(re)) || p.email_bad) out.push({ t: "warn", f: "email", m: `Email “${re.slice(0, 40)}” looks wrong` });
    if (!d.name) out.push({ t: "warn", f: "name", m: "No name" });
    if (!d.handle) out.push({ t: "warn", f: "handle", m: "No Instagram handle" });
    return out;
  });
  const merged = (i) => P[i] && (P[i].duplicate || P[i].already);
  const canAnyway = (i) => !(P[i] && P[i].no_contact);
  const include = (i) => !merged(i) && (block[i] ? choice[i] === "anyway" && canAnyway(i) : choice[i] !== "skip");
  const silentOf = (i) => include(i) && (!!block[i] || choice[i] === "silent");
  const skipOf = (i) => !include(i);
  const okIdx = up.rows.map((_, i) => i).filter((i) => include(i));
  const silentN = okIdx.filter(silentOf).length;
  const attn = up.rows.map((_, i) => i).filter((i) => !merged(i) && issues[i].length);
  const setCh = (i, v) => setChoice((c) => ({ ...c, [i]: c[i] === v ? undefined : v }));
  const FIX = [["name", "Name"], ["handle", "Instagram"], ["phone", "WhatsApp"], ["email", "Email"], ["city", "City"], ["address", "Address"], ["state", "State"], ["pincode", "PIN code"], ["courier", "Courier"], ["tracking", "Tracking ID"], ["video_link", "Video link"], ["post_link", "Post link"]];
  const fixFields = (i) => {
    const b = String(block[i] || "") + issues[i].map((x) => x.f || "").join(" ");
    return FIX.filter(([k, l]) => ["name", "handle", "phone", "email", "city"].includes(k) || b.toLowerCase().includes(l.toLowerCase()) || (k === "pincode" && /pin/i.test(b)) || (k === "tracking" && /tracking/i.test(b)));
  };
  const openFix = (i) => {
    const v = {};
    FIX.forEach(([k]) => (v[k] = rawOf(up.rows[i], k)));
    setFixVals(v);
    setFixing(i);
  };
  const saveFix = () => {
    const i = fixing,
      map = { ...up.map };
    let rows = up.rows;
    FIX.forEach(([k]) => {
      const nv = String(fixVals[k] ?? "").trim();
      if (nv === rawOf(up.rows[i], k)) return;
      if (map[k] == null) {
        // sheet mein ye column tha hi nahi — naya column jodo (baaki rows khaali)
        const col = Math.max(0, ...rows.map((r) => r.cells.length));
        map[k] = col;
        rows = rows.map((r) => ({ ...r, cells: [...r.cells, ...Array(col + 1 - r.cells.length).fill("")] }));
      }
      rows = rows.map((r, j) => (j === i ? { ...r, cells: r.cells.map((c, n) => (n === map[k] ? nv : c)) } : r));
    });
    const nu = { ...up, map, rows, rev: (up.rev || 0) + 1 };
    setUp(nu);
    saveUpload(id, nu);
    setChoice((c) => ({ ...c, [i]: undefined }));
    setFixing(null);
    show(`Row ${sheetLine(up, i)} updated — checking again…`);
  };
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
    const m = m0 === "no message" && !p.on_platform && stRank(st) >= 4 ? "Campaign invite" : m0;
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
    // "Use the sheet" chune groups — upload ke baad Geek OS par likhe jaate hain (purana bulk_apply_choice)
    const useSheet = [];
    rows0.forEach((d, i) => {
      const pk = picks[i] || {};
      diffsOf(d, ex[i], kind).forEach(({ g }) => {
        if (pk[g] !== "sheet") return;
        const o = { group: g, phone: d.phone, email: d.email, handle: d.handle };
        (DIFF.find((x) => x[0] === g) || [, []])[1].forEach((k) => (o[k] = d[k]));
        useSheet.push(o);
      });
    });
    rows0.forEach((d, i) => (kept += keepSite(d, ex[i], kind, picks[i])));
    mergeRepeats(rows0, P);
    const why = up.rows.map((r, i) => (choice[i] === "skip" && !block[i] ? "Skipped by you" : block[i] && !include(i) ? block[i] : P[i] && P[i].already && !rows0[i]._merged ? "Already in this campaign — nothing new in the row" : null));
    up.rows.forEach((r, i) => {
      if (!why[i] && P[i] && P[i].duplicate) why[i] = P[i].multi ? `Same ${P[i].multi.by} as row ${sheetLine(up, P[i].multi.row)} — @${P[i].multi.handle} added to that creator as another Instagram` : `Repeat of row ${sheetLine(up, P[i]._dupOf != null ? P[i]._dupOf : 0)} — same person, merged into that row`;
    });
    const keepIdx = rows0.map((d, i) => i).filter((i) => !why[i] && !(P[i] && (P[i].duplicate || (P[i].already && !rows0[i]._merged))));
    const rows = keepIdx.map((i) => rows0[i]);
    const loud = keepIdx.filter((i) => !silentOf(i)).map((i) => rows0[i]);
    const quiet = keepIdx.filter((i) => silentOf(i)).map((i) => rows0[i]);
    const notUp = up.rows
      .map((r, i) => {
        if (!why[i]) return null;
        const x = rowData(up, r, kind);
        return { row: sheetLine(up, i), name: x.name, handle: x.handle, phone: x.phone, email: x.email, status: r.status || "registered", reason: why[i] };
      })
      .filter(Boolean);
    if (!rows.length && useSheet.length) {
      setBusy(true);
      const ap = await rpc("admin", "api.bulk_apply_choice", { p_campaign: id, p_rows: useSheet });
      setBusy(false);
      if (ap.error) return setErr(errText(ap.error));
      return show(`✓ Updated ${(ap.data && ap.data.applied) || 0} detail(s) from the sheet`);
    }
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
    // normal rows → invite + messages · "upload anyway / no message" rows → added silently (no WhatsApp / email)
    const res = [];
    for (const [fn, list] of [["api.bulk_import_creators", loud], ["api.bulk_import_creators_silent", quiet]]) {
      if (!list.length) continue;
      const { data: dx, error } = await rpc("admin", fn, { p_campaign: id, p_rows: list, p_note: msg.trim() || null });
      if (error) {
        setBusy(false);
        return setErr((res.length ? "Some rows were uploaded, but the rest failed: " : "") + errText(error));
      }
      res.push(dx || {});
    }
    const d = res.reduce((m, x) => {
      Object.entries(x).forEach(([k, v]) => (typeof v === "number" ? (m[k] = (m[k] || 0) + v) : m[k] == null && (m[k] = v)));
      return m;
    }, {});
    if (quiet.length) notes.push(`🔕 ${quiet.length} creator${quiet.length > 1 ? "s" : ""} added without any message (WhatsApp / email) — as you chose`);
    if (notUp.length && d.batch_id) await rpc("admin", "api.bulk_log_skipped", { p_campaign: id, p_batch: d.batch_id, p_rows: notUp });
    const codes = rows.filter((x) => x.coupon && x.handle).map((x) => ({ handle: String(x.handle).replace(/^@/, ""), code: x.coupon }));
    if (codes.length) {
      const cr = await rpc("admin", "api.track_codes_bulk", { p_campaign: id, p_rows: codes, p_overwrite: true });
      notes.push(cr.error ? `🎟️ Codes not saved: ${errText(cr.error)}` : `🎟️ ${(cr.data && cr.data.set) || 0} coupon code${((cr.data && cr.data.set) || 0) !== 1 ? "s" : ""} saved${cr.data && cr.data.skipped ? ` · ${cr.data.skipped} not matched` : ""}`);
    }
    if (useSheet.length) {
      const ap = await rpc("admin", "api.bulk_apply_choice", { p_campaign: id, p_rows: useSheet });
      notes.push(ap.error ? `🔀 Sheet details not applied: ${errText(ap.error)}` : `🔀 ${(ap.data && ap.data.applied) || 0} detail(s) taken from the sheet`);
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
        {ready && attn.length > 0 && (
          <div className="uc-attn">
            <h3>
              ⚠️ {attn.length} row{attn.length > 1 ? "s" : ""} need{attn.length === 1 ? "s" : ""} a look
              <small>Fix the details here, skip the row, or upload it anyway without sending any message.</small>
            </h3>
            {attn.map((i) => {
              const d = data[i],
                bad = !!block[i],
                c = choice[i],
                st = !include(i) ? "skip" : silentOf(i) ? "silent" : "go";
              return (
                <div key={i} className={`uc-ar ${bad ? "is-err" : ""}`}>
                  <div className="uc-ar__top">
                    <span className="uc-ar__row">Row {sheetLine(up, i)}</span>
                    <b>{d.name || (d.handle ? "@" + hd(d) : "—")}</b>
                    <span className={`uc-pill ${st === "skip" ? "uc-pill--bad" : st === "silent" ? "uc-pill--warn" : "uc-pill--good"}`}>{st === "skip" ? "⛔ Won’t be uploaded" : st === "silent" ? "🔕 Uploads · no message" : "✓ Uploads"}</span>
                  </div>
                  <ul>
                    {issues[i].map((x, n) => (
                      <li key={n} className={x.t === "error" ? "uc-e" : "uc-wn"}>
                        {x.t === "error" ? "⛔" : "⚠️"} {x.m}
                      </li>
                    ))}
                  </ul>
                  <div className="uc-ar__btns">
                    <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" onClick={() => (fixing === i ? setFixing(null) : openFix(i))}>
                      ✎ Fix
                    </button>
                    {!bad && (
                      <button type="button" className={`ga-btn ga-btn--sm ${c === "skip" ? "ga-btn--primary" : "ga-btn--ghost"}`} onClick={() => setCh(i, "skip")}>
                        Skip row
                      </button>
                    )}
                    {bad ? (
                      canAnyway(i) && (
                        <button type="button" className={`ga-btn ga-btn--sm ${c === "anyway" ? "ga-btn--primary" : "ga-btn--ghost"}`} onClick={() => setCh(i, "anyway")}>
                          {c === "anyway" ? "✓ Uploading anyway · no message" : "Upload anyway · no message"}
                        </button>
                      )
                    ) : (
                      <button type="button" className={`ga-btn ga-btn--sm ${c === "silent" ? "ga-btn--primary" : "ga-btn--ghost"}`} onClick={() => setCh(i, "silent")}>
                        {c === "silent" ? "✓ No message" : "Upload · no message"}
                      </button>
                    )}
                    {bad && !canAnyway(i) && <small className="uc-mute">Needs a WhatsApp, email or Instagram — fix it or it is skipped.</small>}
                  </div>
                  {fixing === i && (
                    <div className="uc-fix">
                      {fixFields(i).map(([k, l]) => (
                        <label key={k}>
                          <span>
                            {l}
                            {up.map[k] == null ? " (new column)" : ""}
                          </span>
                          <input className="ga-input" value={fixVals[k] || ""} onChange={(e) => setFixVals((v) => ({ ...v, [k]: e.target.value }))} placeholder={k === "phone" ? "10-digit mobile" : ""} />
                        </label>
                      ))}
                      <div className="uc-fix__act">
                        <button type="button" className="ga-btn ga-btn--primary ga-btn--sm" onClick={saveFix}>
                          Save & check again
                        </button>
                        <button type="button" className="ga-btn ga-btn--ghost ga-btn--sm" onClick={() => setFixing(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
          ℹ️ Each row only needs the columns of its own Status —{kind !== "paid" && kind !== "visit" ? " Address confirmed: Address, City, State, PIN · Courier sent / delivered: Courier + Tracking ·" : ""} Video submitted / Client approved: Video link · Posted / Done: Post link.
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
                  <tr key={i} className={!include(i) && !merged(i) ? "is-bad" : ""}>
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
                        include(i) ? <span className="uc-pill uc-pill--warn">🔕 Upload anyway · no message — {block[i]}</span> : <span className="uc-pill uc-pill--bad">⛔ Not uploaded — {block[i]}</span>
                      ) : (
                        <>
                          <span className={`uc-pill${w.good ? " uc-pill--good" : ""}`}>{w.main}</span>
                          {w.warn && <span className="uc-pill uc-pill--warn">{w.warn}</span>}
                          {w.sends && <small>{w.sends}</small>}
                          {w.ig && <small>{w.ig}</small>}
                          {diffsOf(d, ex[i], kind).map(({ g, site, sheet }) => {
                            const cur = (picks[i] || {})[g] || "site";
                            const setP = (v) => setPicks((pp) => ({ ...pp, [i]: { ...(pp[i] || {}), [g]: v } }));
                            return (
                              <span key={g} className="uc-diff">
                                <b>🔀 {DIFF_LABEL[g]} differs</b>
                                <label>
                                  <input type="radio" checked={cur === "site"} onChange={() => setP("site")} /> Keep Geek OS: <i>{site}</i>
                                </label>
                                <label>
                                  <input type="radio" checked={cur === "sheet"} onChange={() => setP("sheet")} /> Use the sheet: <i>{sheet}</i>
                                </label>
                              </span>
                            );
                          })}
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
            {busy ? "Uploading…" : `Upload & invite ${okIdx.length} creator${okIdx.length === 1 ? "" : "s"}${silentN ? ` · ${silentN} without message` : ""}`}
          </button>
          {up.rows.filter((_, i) => !include(i) && !merged(i)).length > 0 && <b className="uc-bad">{up.rows.filter((_, i) => !include(i) && !merged(i)).length} not uploaded (see above)</b>}
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
              .uc-diff { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; padding: 7px 9px; border-radius: 9px; background: #fff7e8; border: 1px solid #f6dfb4; font-size: 12px; color: #6b4a12; }
        .uc-attn { margin-top: 16px; padding: 14px; border-radius: 14px; border: 1px solid #f3d9a8; background: #fffaf0; }
        .uc-attn h3 { font-size: 14px; font-weight: 800; color: #7a4b00; }
        .uc-attn h3 small { display: block; margin-top: 3px; font-size: 12px; font-weight: 500; color: var(--ad-muted); }
        .uc-ar { margin-top: 10px; padding: 11px 12px; border-radius: 12px; background: #fff; border: 1px solid #f1e3c6; }
        .uc-ar.is-err { border-color: #f5c9d0; }
        .uc-ar__top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 13px; }
        .uc-ar__row { font-size: 11px; font-weight: 700; color: var(--ad-muted); }
        .uc-ar ul { margin: 6px 0 0; padding: 0; list-style: none; font-size: 12.5px; line-height: 1.5; }
        .uc-e { color: #c0392b; }
        .uc-wn { color: #8a5a00; }
        .uc-ar__btns { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 8px; }
        .uc-mute { font-size: 12px; color: var(--ad-muted); }
        .uc-fix { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 10px; padding: 12px; border-radius: 10px; background: var(--ad-soft-2); }
        .uc-fix label span { display: block; font-size: 11px; font-weight: 700; color: var(--ad-muted); margin-bottom: 3px; }
        .uc-fix .ga-input { height: 38px; width: 100%; }
        .uc-fix__act { grid-column: 1 / -1; display: flex; gap: 8px; }
        .uc-diff label { display: flex; gap: 6px; align-items: baseline; cursor: pointer; }
        .uc-diff i { font-style: normal; color: var(--ad-ink); word-break: break-word; }
`}</style>
    </AdminShell>
  );
}
