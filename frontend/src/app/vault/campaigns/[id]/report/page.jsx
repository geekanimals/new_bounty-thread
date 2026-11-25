"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import WorkspaceHead from "@/components/admin/WorkspaceHead";
import ReportTabs from "@/components/admin/campaign2/ReportTabs";
import { Panel, MiniStats, Note, TableState, useToast, downloadFile, num } from "@/components/admin/campaign2/kit";
import { useRpc, rpc, errText, SUPABASE_URL } from "@/lib/supabase";
import { useAsk, readInsightsShot, uploadInsightsProof } from "@/components/admin/campaign/journey";
import { useProofNeeds } from "@/components/admin/campaign2/ContentTabs";
import { shotSha, sigOf, shotDupMessage, rememberShot } from "@/lib/proofShot";

/*
 * 📈 Campaign report.
 * Data: api.campaign_analytics(p_campaign) → { campaign, totals, creators[{ creator, posts[{ post_id|id, media_type, permalink, posted_at, stats }], totals }] }
 * Upar chips brief ke tick se banti hain: All · Reel 1 · Reel 2 · Story 1 · Post 1 · Reviews — har chip ke apne columns.
 * "Add insights": insights ka screenshot daalo → browser hi numbers padh leta hai (free OCR) → check karke save.
 * Story ke liye wahi screenshot story ka proof bhi ban jaata hai (creator "Done" ho jaata hai).
 */
const handleOf = (r) => String((r.creator || {}).username || (r.creator || {}).handle || r.handle || "").replace(/^@/, "");
const nameOf = (r) => (r.creator || {}).name || (handleOf(r) ? "@" + handleOf(r) : "Creator");
const kindOf = (p) => {
  const m = String((p && p.media_type) || "").toLowerCase();
  return m.includes("stor") ? "story" : m.includes("reel") || m === "video" ? "reel" : "feed";
};
const KIND_LABEL = { reel: "Reel", story: "Story", feed: "Post" };
const COLS = {
  all: [["views", "Views"], ["reach", "Reach"], ["likes", "Likes"], ["comments", "Comments"], ["shares", "Shares"], ["saves", "Saves"]],
  reel: [["views", "Views"], ["reach", "Reach"], ["likes", "Likes"], ["comments", "Comments"], ["reposts", "Reposts"], ["shares", "Shares"], ["saves", "Saves"], ["avg_watch_s", "Avg watch"], ["skip_rate_pct", "Skip rate"], ["follows", "Follows"]],
  story: [["views", "Views"], ["reach", "Reach"], ["interactions", "Interactions"], ["profile_visits", "Profile activity"], ["replies", "Replies"], ["link_clicks", "Link clicks"], ["sticker_taps", "Sticker taps"], ["followers_pct", "Followers %"], ["forward", "Forward"], ["back", "Back"], ["next_story", "Next story"], ["exited", "Exited"]],
};
COLS.feed = COLS.reel.filter(([k]) => k !== "avg_watch_s");
// har type ke ye columns hamesha dikhte hain; baaki tabhi jab kisi creator ka number ho (story ke Overview mein reach hota hi nahi)
const CORE = { reel: ["views", "reach", "likes", "comments"], feed: ["views", "reach", "likes", "comments"], story: ["views", "interactions", "profile_visits"] };
const colsFor = (kd, list) => COLS[kd].filter(([k]) => CORE[kd].includes(k) || list.some(({ p }) => p && p.stats && p.stats[k] != null));
// ☑ report ke columns chuno — jo tick, wahi table mein aur wahi CSV mein (report ke apne fields)
const DETAILS = [["profile_link", "Profile link"], ["on_geek", "On Geek OS"], ["followers", "Followers"], ["posted_on", "Posted on"], ["post_link", "Post link"], ["screenshot", "Insights screenshot"], ["source", "Numbers from"], ["status", "Status"]];
const SRC_TXT = (st) => (st.source === "public" ? "public profile" : st.source === "screenshot" ? "screenshot" : st.source === "manual" ? "typed in" : st.source ? "Instagram insights" : "");
const STAGE_TXT = (s) => String(s || "").replace(/_/g, " ");
const FORM_LABEL = { views: "Views", reach: "Reach (Viewers / Accounts reached)", likes: "Likes ❤️", comments: "Comments 💬", reposts: "Reposts 🔁", shares: "Shares / sends ✈️", saves: "Saves 🔖", avg_watch_s: "Average watch time (seconds — 7s, 1m 5s)", skip_rate_pct: "Skip rate (%)", follows: "Follows", interactions: "Interactions", profile_visits: "Profile activity", replies: "Replies", link_clicks: "Link clicks", sticker_taps: "Sticker taps", followers_pct: "Viewed by followers (%)", forward: "Forward taps", back: "Back taps", next_story: "Next story", exited: "Exited" };
const fmt = (k, v) => (v == null || v === "" ? "—" : k === "avg_watch_s" ? (v >= 60 ? `${Math.floor(v / 60)}m ${Math.round(v % 60)}s` : `${v}s`) : /_pct$/.test(k) ? `${v}%` : num(v));
// "12,400" "12.4k" "1.2M" "7s" "1m 5s" "97.1%" → number (null = empty / unreadable)
function parseVal(k, raw) {
  const t = String(raw ?? "").trim().toLowerCase().replace(/,/g, "");
  if (!t) return null;
  if (k === "avg_watch_s") {
    const m = t.match(/^(?:(\d+)\s*m)?\s*(?:(\d+(?:\.\d+)?)\s*s?)?$/);
    return m && (m[1] || m[2]) ? Number(m[1] || 0) * 60 + Number(m[2] || 0) : null;
  }
  if (/_pct$/.test(k)) {
    const m = t.match(/^(\d{1,3}(?:\.\d+)?)\s*%?$/);
    return m && Number(m[1]) <= 100 ? Math.round(Number(m[1]) * 100) / 100 : null;
  }
  const m = t.replace(/\s/g, "").match(/^([0-9]+(?:\.[0-9]+)?)(k|m|l|lakh)?$/);
  return m ? Math.round(Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : m[2] ? 1e5 : 1)) : null;
}
const abs = (u) => (/^https?:/i.test(u || "") ? u : SUPABASE_URL + u);

export default function CampaignReport() {
  const { id } = useParams();
  const [toast, show] = useToast();
  const [q, setQ] = useState("");
  // all | reel-1 | story-2 | feed-1 | reviews — ?view=story-1 (Story screenshots page ka link) se wahi chip khule
  const [view, setView] = useState(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("view")) || "all");
  const [askEl, ask] = useAsk();
  // { reel: [keys], story: [...], feed: [...], details: [...] } — na ho to apne aap (CORE + jinka number hai); browser yaad rakhta hai
  const pkKey = `geek_report_cols_${id}`;
  const [pick, setPickRaw] = useState(() => {
    try {
      return (typeof window !== "undefined" && JSON.parse(window.localStorage.getItem(pkKey) || "null")) || {};
    } catch {
      return {};
    }
  });
  const setPick = (fn) =>
    setPickRaw((cur) => {
      const nx = typeof fn === "function" ? fn(cur) : fn;
      try {
        window.localStorage.setItem(pkKey, JSON.stringify(nx));
      } catch {
        /* storage band — sirf is page ke liye */
      }
      return nx;
    });
  const { data, error, loading, reload } = useRpc("admin", "api.campaign_analytics", { p_campaign: id }, { skip: !id || id === "sample" });
  const proofs = useProofNeeds(id);
  const needs = proofs.needs || {};
  const reviewsNeed = proofs.reviews;
  const rv = useRpc("admin", "api.campaign_review_proofs", { p_campaign: id }, { skip: !id || id === "sample" || !reviewsNeed });
  const a = data || {};
  const t = a.totals || {};
  const rows = useMemo(() => a.creators || [], [a.creators]);
  const N = rows.length;

  // brief ke tick → chips
  const chips = useMemo(() => {
    const out = [{ k: "all", label: "All posts" }];
    [["reel", "🎬"], ["story", "📸"], ["feed", "🖼️"]].forEach(([kind, ic]) => {
      const n = Number(needs[kind]) || 0;
      for (let i = 1; i <= n; i++) out.push({ k: `${kind}-${i}`, kind, n: i, label: `${ic} ${KIND_LABEL[kind]}${n > 1 ? " " + i : ""}` });
    });
    if (reviewsNeed) out.push({ k: "reviews", label: "⭐ Reviews" });
    return out;
  }, [needs.reel, needs.story, needs.feed, reviewsNeed]); // eslint-disable-line react-hooks/exhaustive-deps
  const chip = chips.find((c) => c.k === view) || chips[0];
  const kind = chip.kind || "all";

  // har creator ki is chip wali post (Reel 2 = us creator ki doosri reel, posted date ke kram se)
  const nth = (r, kd, n) =>
    (r.posts || [])
      .filter((p) => kindOf(p) === kd)
      .sort((x, y) => String(x.posted_at || "").localeCompare(String(y.posted_at || "")))[n - 1] || null;
  const allRows = useMemo(() => {
    if (chip.k === "all" || chip.k === "reviews") return rows.flatMap((r) => (r.posts || []).map((p, i) => ({ r, p, key: `${r.participation_id || r.invite_id}-${i}` })));
    return rows.map((r) => ({ r, p: nth(r, chip.kind, chip.n), key: `${r.participation_id || r.invite_id}-${chip.k}` }));
  }, [rows, chip.k]); // eslint-disable-line react-hooks/exhaustive-deps
  const qq = q.trim().toLowerCase();
  const shown = qq ? allRows.filter(({ r }) => `${nameOf(r)} ${handleOf(r)} ${(r.creator || {}).city || ""}`.toLowerCase().includes(qq)) : allRows;
  // All posts → har type ka apna hissa (Reels · Stories · Posts), apne columns ke saath — kabhi mila ke nahi
  const sections =
    kind === "all"
      ? ["reel", "story", "feed"].map((kd) => ({ kd, list: shown.filter(({ p }) => kindOf(p) === kd), total: allRows.filter(({ p }) => kindOf(p) === kd).length })).filter((x) => x.total > 0)
      : [{ kd: kind, list: shown, total: allRows.length }];

  // ☑ tick wale columns — table aur CSV dono yahi use karte hain
  const effCols = (kd, list) => (Array.isArray(pick[kd]) ? COLS[kd].filter(([k]) => pick[kd].includes(k)) : colsFor(kd, list));
  const det = Array.isArray(pick.details) ? pick.details : DETAILS.map(([k]) => k);
  const hasDet = (k) => det.includes(k);
  const toggleCol = (kd, k, list) =>
    setPick((cur) => {
      const now = Array.isArray(cur[kd]) ? cur[kd] : colsFor(kd, list).map(([x]) => x);
      return { ...cur, [kd]: now.includes(k) ? now.filter((x) => x !== k) : [...now, k] };
    });
  const toggleDet = (k) => setPick((cur) => ({ ...cur, details: det.includes(k) ? det.filter((x) => x !== k) : [...det, k] }));
  const setAllCols = (kd, on) => setPick((cur) => ({ ...cur, [kd]: on ? COLS[kd].map(([k]) => k) : [] }));
  const resetCols = () => setPick({});

  // ---- tiles (sirf asli numbers jodo, andaza nahi) ----
  const sumOf = (list, k) => {
    let n = 0,
      v = 0;
    list.forEach((x) => {
      const val = x == null ? null : x[k];
      if (val != null && val !== "") {
        n++;
        v += +val || 0;
      }
    });
    return { v: n ? v : null, n };
  };
  const cov = (n, of) => (of ? `from ${n} of ${of} creator${of > 1 ? "s" : ""}` : "");
  let tiles;
  if (kind === "all") {
    let eNum = 0,
      eFol = 0;
    rows.forEach((r) => {
      const x = r.totals || {},
        f = +(r.creator || {}).followers || 0;
      if (f > 0 && (x.likes != null || x.comments != null)) {
        eFol += f;
        eNum += (+x.likes || 0) + (+x.comments || 0) + (+x.shares || 0) + (+x.saves || 0);
      }
    });
    const of = (kd) => rows.flatMap((r) => (r.posts || []).filter((p) => kindOf(p) === kd).map((p) => p.stats || {}));
    const reelV = sumOf(of("reel"), "views"),
      storyV = sumOf(of("story"), "views");
    tiles = [
      { value: num(t.creators_live), label: "Creators live" },
      { value: num(of("reel").length), label: "Reels", note: of("story").length ? `${of("story").length} stories` : "" },
      { value: num(reelV.v), label: "Reel views", note: reelV.n ? `from ${reelV.n} reels` : "" },
      // story na ho (brief mein nahi / koi aayi nahi) to uski jagah reel reach
      of("story").length || needs.story > 0
        ? { value: num(storyV.v), label: "Story views", note: storyV.n ? `from ${storyV.n} stories` : "" }
        : (() => {
            const rr = sumOf(of("reel"), "reach");
            return { value: num(rr.v), label: "Reel reach", note: rr.n ? `from ${rr.n} reels` : "" };
          })(),
      { value: eFol ? ((100 * eNum) / eFol).toFixed(1) + "%" : "—", label: "Engagement on followers" },
    ];
  } else if (kind !== "story") {
    const ps = allRows.filter((x) => x.p).map((x) => x.p.stats || {});
    const views = sumOf(ps, "views"),
      reach = sumOf(ps, "reach");
    let eNum = 0,
      eFol = 0;
    allRows.forEach(({ r, p }) => {
      const s = (p && p.stats) || {},
        f = +(r.creator || {}).followers || 0;
      if (p && f > 0 && (s.likes != null || s.comments != null)) {
        eFol += f;
        eNum += (+s.likes || 0) + (+s.comments || 0) + (+s.shares || 0) + (+s.saves || 0) + (+s.reposts || 0);
      }
    });
    const w = ps.filter((s) => s.avg_watch_s != null);
    tiles = [
      { value: `${ps.length} / ${N}`, label: `${chip.label.replace(/^\S+\s/, "")} posted` },
      { value: num(views.v), label: "Views", note: cov(views.n, N) },
      { value: num(reach.v), label: "Reach", note: cov(reach.n, N) },
      { value: eFol ? ((100 * eNum) / eFol).toFixed(1) + "%" : "—", label: "Engagement on followers" },
      { value: w.length ? fmt("avg_watch_s", Math.round((10 * w.reduce((x, s) => x + +s.avg_watch_s, 0)) / w.length) / 10) : "—", label: "Average watch time", note: w.length ? cov(w.length, N) : "" },
    ];
  } else {
    const ps = allRows.filter((x) => x.p).map((x) => x.p.stats || {});
    const views = sumOf(ps, "views"),
      inter = sumOf(ps, "interactions"),
      prof = sumOf(ps, "profile_visits"),
      taps = sumOf(ps, "sticker_taps"),
      reps = sumOf(ps, "replies");
    const extra = taps.n ? { value: num(taps.v), label: "Sticker taps", note: cov(taps.n, N) } : { value: num(reps.v), label: "Replies", note: cov(reps.n, N) };
    tiles = [
      { value: `${ps.length} / ${N}`, label: `${chip.label.replace(/^\S+\s/, "")} in` },
      { value: num(views.v), label: "Story views", note: cov(views.n, N) },
      { value: num(inter.v), label: "Interactions", note: cov(inter.n, N) },
      { value: num(prof.v), label: "Profile activity", note: cov(prof.n, N) },
      extra,
    ];
  }

  // ---- numbers form (insights screenshot → auto-read) ----
  const addNums = async (r, p, kd) => {
    const k0 = kd || kindOf(p);
    const isNewStory = !p && k0 === "story";
    const st = (p && p.stats) || {};
    const keys = COLS[k0 === "story" ? "story" : k0 === "feed" ? "feed" : "reel"].map(([k]) => k);
    const v = await ask({
      title: isNewStory ? `${nameOf(r)}’s story — insights screenshot` : `Numbers for ${nameOf(r)}’s ${KIND_LABEL[k0].toLowerCase()}`,
      text: isNewStory
        ? "Add the story's insights screenshot — we read every number off it. It also counts as the story's proof."
        : "Add the insights screenshot — we read every number off it (views, reach, likes…). Check them, fix anything, then save. Leave a box empty if it isn't on the screenshot.",
      ok: "Save numbers",
      fields: [
        { k: "shot", label: isNewStory ? "📸 Story insights screenshot (needed)" : "📷 Insights screenshot — numbers fill in on their own", file: true, onFile: (f, setV) => readInsightsShot(f, k0, setV) },
        ...keys.map((k) => ({ k, label: FORM_LABEL[k], value: st[k] == null ? "" : String(st[k]), placeholder: k === "avg_watch_s" ? "e.g. 7s" : /_pct$/.test(k) ? "e.g. 67.85" : "e.g. 12,400 or 12.4k" })),
      ],
    });
    if (!v) return;
    const metrics = {};
    const bad = [];
    keys.forEach((k) => {
      if (String(v[k] ?? "").trim() === "") return;
      const n = parseVal(k, v[k]);
      if (n == null) bad.push(FORM_LABEL[k].split(" (")[0]);
      else metrics[k] = n;
    });
    if (bad.length) return show(`Check ${bad.join(", ")} — that isn't a number.`);
    const file = v.shot && typeof v.shot === "object" ? v.shot : null;
    if (isNewStory && !file) return show("Add the story's screenshot — it is the story's proof.");
    if (!Object.keys(metrics).length && !file) return show("Add at least one number or the screenshot.");
    let shot = null,
      sha = null;
    const sig = sigOf(metrics);
    const owner = { participation_id: r.participation_id, invite_id: r.invite_id };
    if (file) {
      // the same screenshot can't be on another creator (or twice on this one) — exact file or the very same numbers
      sha = await shotSha(file);
      const dup = await shotDupMessage("admin", id, sha, sig, owner, { allowSameCreator: !!p });
      if (dup) return show(dup);
      try {
        shot = await uploadInsightsProof(file);
      } catch (e) {
        return show(e.message || String(e));
      }
    }
    const mt = k0 === "feed" ? "post" : k0;
    let res,
      postRef = (p && (p.post_id || p.id)) || null;
    if (r.participation_id) {
      let postId = p && p.post_id;
      if (isNewStory) {
        const add = await rpc("admin", "api.bp_add_post_link", { p_participation: r.participation_id, p_payload: { media_type: "story", screenshot_url: shot } });
        if (add.error) return show(errText(add.error));
        postId = add.data && add.data.post_id;
        postRef = postId;
      }
      res = Object.keys(metrics).length || shot ? await rpc("admin", "api.bp_record_metrics", { p_participation: r.participation_id, p_payload: { ...metrics, ...(shot ? { screenshot_url: shot } : {}), ...(postId ? { post_id: postId } : {}) } }) : { error: null };
      // sirf screenshot, koi number nahi → bp_record_metrics "add at least one number" bolta hai; story ka proof to jud chuka
      if (res.error && isNewStory && /at least one number/i.test(errText(res.error))) res = { error: null };
    } else {
      res = await rpc("admin", "api.invite_add_post", {
        p_invite: r.invite_id,
        p_payload: { ...(p && p.permalink ? { permalink: p.permalink } : p && p.id ? { id: p.id } : {}), media_type: mt, metrics, screenshot_url: shot },
      });
    }
    if (res.error) return show(errText(res.error));
    if (!r.participation_id && res.data && res.data.id) postRef = res.data.id;
    if (sha) await rememberShot("admin", id, sha, sig, owner, postRef, shot);
    show(isNewStory ? "Story added with its numbers ✓" : "Numbers saved ✓");
    reload();
    proofs.reload && proofs.reload();
  };
  const canEdit = (r, p) => !!(r.participation_id || (r.invite_id && p && (p.permalink || p.id)));

  // ---- CSV: har type alag hissa (Reels · Stories · Posts) — apne total aur apne columns ke saath, kabhi mila ke nahi ----
  const download = () => {
    const c = a.campaign || {};
    const out = [[`${c.name || "Campaign"} — report`], [c.brand || ""], [], ["Creators live", t.creators_live ?? ""]];
    const SECT = { reel: "REELS", story: "STORIES", feed: "POSTS" };
    ["reel", "story", "feed"].forEach((kd) => {
      const list = [];
      rows.forEach((r) => {
        let n = 0;
        [...(r.posts || [])]
          .filter((p) => kindOf(p) === kd)
          .sort((x, y) => String(x.posted_at || "").localeCompare(String(y.posted_at || "")))
          .forEach((p) => list.push({ r, p, n: ++n }));
      });
      if (!list.length) return;
      const cols = effCols(kd, list);
      const tot = cols
        .filter(([k]) => !/_pct$|avg_watch_s/.test(k))
        .map(([k, l]) => {
          const sm = sumOf(list.map((x) => x.p.stats || {}), k);
          return [`${l} (total)`, sm.v ?? "", sm.n ? `from ${sm.n} of ${list.length}` : ""];
        });
      out.push([], [`${SECT[kd]} — ${list.length}`], ...tot, []);
      const D = (k, l) => (hasDet(k) ? [l] : []);
      out.push(["Instagram", "Name", ...D("profile_link", "Profile link"), ...D("on_geek", "On Geek OS"), ...D("followers", "Followers"), "Deliverable", ...D("post_link", "Post link"), ...D("posted_on", "Posted on"), ...cols.map(([, l]) => l), ...D("screenshot", "Insights screenshot"), ...D("source", "Numbers from"), ...D("status", "Status")]);
      list.forEach(({ r, p, n }) => {
        const cr = r.creator || {},
          h = handleOf(r),
          st = p.stats || {};
        const V = (k, v) => (hasDet(k) ? [v] : []);
        out.push([
          h ? "@" + h : "",
          cr.name || "",
          ...V("profile_link", h ? `https://instagram.com/${h}` : ""),
          ...V("on_geek", r.on_sheet || cr.followers == null ? "Not yet" : "Yes"),
          ...V("followers", cr.followers ?? ""),
          `${KIND_LABEL[kd]} ${n}`,
          ...V("post_link", p.permalink || ""),
          ...V("posted_on", p.posted_at ? new Date(p.posted_at).toLocaleDateString("en-IN") : ""),
          ...cols.map(([k]) => st[k] ?? ""),
          ...V("screenshot", st.screenshot_url || p.screenshot_url || ""),
          ...V("source", SRC_TXT(st)),
          ...V("status", r.stage),
        ]);
      });
    });
    downloadFile(`${(c.name || "campaign").replace(/[^\w-]+/g, "_")}_report.csv`, out);
    show("Campaign report downloaded");
  };

  // ---- reviews chip ----
  const rvd = rv.data || {};
  const rvNeed = rvd.need || {};
  const rvKinds = [["google_review", "⭐ Google review"], ["district_review", "🎟️ District review"]].filter(([k]) => Number(rvNeed[k]) > 0);
  const rvList = (rvd.creators || []).filter((c) => !qq || `${c.name} ${c.handle}`.toLowerCase().includes(qq));

  return (
    <AdminShell>
      <WorkspaceHead id={id} />
      <ReportTabs id={id} active="report" />

      <Panel
        title="📈 Campaign report"
        sub="Every creator's numbers, by what the brief asks for. Updates on its own as Instagram shares insights — or add the insights screenshot and we read the numbers."
        actions={
          <button type="button" className="ga-btn ga-btn--primary" onClick={download} disabled={!rows.length}>
            ⬇️ Download report
          </button>
        }
      >
        {chips.length > 1 && (
          <div className="rp-chips" role="tablist" aria-label="Show">
            {chips.map((c) => (
              <button key={c.k} type="button" role="tab" aria-selected={c.k === chip.k} className={`rp-chip ${c.k === chip.k ? "is-on" : ""}`} onClick={() => setView(c.k)}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {chip.k !== "reviews" && sections.length > 0 && (
          <div className="rp-pick" aria-label="Choose columns">
            <p className="rp-pick__t">
              ☑ Choose columns — what you tick shows here and goes into the download{" "}
              <button type="button" className="rp-pick__x" onClick={resetCols}>
                Reset
              </button>
            </p>
            {sections.map(({ kd, list }) => {
              const on = effCols(kd, list).map(([k]) => k);
              return (
                <div key={kd} className="rp-pick__row">
                  <span className="rp-pick__g">{kd === "reel" ? "🎬 Reels" : kd === "story" ? "📸 Stories" : "🖼️ Posts"}</span>
                  {COLS[kd].map(([k, l]) => (
                    <label key={k} className={`rp-tick ${on.includes(k) ? "is-on" : ""}`}>
                      <input type="checkbox" checked={on.includes(k)} onChange={() => toggleCol(kd, k, list)} />
                      {l}
                    </label>
                  ))}
                  <button type="button" className="rp-pick__x" onClick={() => setAllCols(kd, on.length < COLS[kd].length)}>
                    {on.length < COLS[kd].length ? "All" : "None"}
                  </button>
                </div>
              );
            })}
            <div className="rp-pick__row">
              <span className="rp-pick__g">🧾 Details</span>
              {DETAILS.map(([k, l]) => (
                <label key={k} className={`rp-tick ${hasDet(k) ? "is-on" : ""}`}>
                  <input type="checkbox" checked={hasDet(k)} onChange={() => toggleDet(k)} />
                  {l}
                </label>
              ))}
            </div>
          </div>
        )}

        {chip.k !== "reviews" && (
          <div className="rp-stats">
            <MiniStats items={tiles} />
          </div>
        )}
        {chip.k === "all" && t.not_connected > 0 && (
          <div className="rp-note">
            <Note tone="amber" icon="📸">
              <b>
                {t.not_connected} creator{t.not_connected > 1 ? "s haven't" : " hasn't"} connected Instagram
              </b>
              — {t.public_ready ? "their views, likes and comments are read from their public profile (fills in over a few hours)." : "connect Facebook once as Super Admin to read public profiles."} For reach, shares, saves and the rest, add their insights screenshot — we read every number off it.
            </Note>
          </div>
        )}
        {kind === "story" && (
          <div className="rp-note">
            <Note tone="amber" icon="📸">
              <b>Add each creator&apos;s story insights screenshot</b> — views, reach, interactions and profile activity are read off it, and it counts as the story&apos;s proof. Many at once?{" "}
              <Link href={`/vault/campaigns/${id}/stories`}>
                <u>Story screenshots → upload in bulk</u>
              </Link>
            </Note>
          </div>
        )}

        <input className="ga-input rp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Filter these rows — name, @handle, city" aria-label="Filter report rows" />

        {chip.k === "reviews" ? (
          <div className="c2-tw">
            <table className="c2-t rp-t">
              <thead>
                <tr>
                  <th>Creator</th>
                  {rvKinds.map(([k, l]) => (
                    <th key={k}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState cols={1 + rvKinds.length} loading={rv.loading && !rv.data} error={!rv.data && rv.error} onRetry={rv.reload} empty={rv.data && !rvList.length && "No creators yet."} />
                {rvList.map((c) => (
                  <tr key={c.key || c.participation_id || c.invite_id}>
                    <td>
                      <b>{c.name || "—"}</b>
                      {c.handle && <small className="rp-sub">@{c.handle}</small>}
                    </td>
                    {rvKinds.map(([k]) => {
                      const ps = (c.proofs || []).filter((p) => p.kind === k);
                      const want = Number(rvNeed[k]) || 0;
                      return (
                        <td key={k}>
                          <div className="rp-cell">
                            {ps.map((p) => (
                              <a key={p.proof_id} href={abs(p.url)} target="_blank" rel="noopener noreferrer" download title="Open / download">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={abs(p.url)} alt="Review screenshot" className="rp-th" />
                              </a>
                            ))}
                            {want > 0 && ps.length < want && <span className="ga-badge ga-badge--red">Missing {want - ps.length}</span>}
                            {want > 0 && ps.length >= want && <span className="ga-badge ga-badge--green">✓</span>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="rp-foot">
              <Link href={`/vault/campaigns/${id}/reviews`}>
                <u>Add or fix review screenshots (one by one or in bulk) →</u>
              </Link>
            </p>
          </div>
        ) : (
          <>
            {((loading && !data) || (!data && error) || (data && !allRows.length)) && (
              <div className="c2-tw">
                <table className="c2-t rp-t">
                  <tbody>
                    <TableState cols={6} loading={loading && !data} error={!data && error} onRetry={reload} empty={data && !allRows.length && "No posts yet — creators show up here as soon as their reel goes live."} />
                  </tbody>
                </table>
              </div>
            )}
            {sections.map(({ kd, list, total }) => {
              const cols = effCols(kd, list);
              return (
                <div key={kd} className="rp-sec">
                  {kind === "all" && (
                    <h3 className="rp-h">
                      {kd === "reel" ? "🎬 Reels" : kd === "story" ? "📸 Stories" : "🖼️ Posts"} <span>{total}</span>
                    </h3>
                  )}
                  <div className="c2-tw">
                    <table className="c2-t rp-t">
                      <thead>
                        <tr>
                          <th>Creator</th>
                          {hasDet("followers") && <th>Followers</th>}
                          <th>{KIND_LABEL[kd]}</th>
                          {hasDet("posted_on") && <th>Posted on</th>}
                          {cols.map(([k, l]) => (
                            <th key={k}>{l}</th>
                          ))}
                          {hasDet("screenshot") && <th>Insights</th>}
                          {hasDet("source") && <th>Numbers from</th>}
                          {hasDet("status") && <th>Status</th>}
                          <th aria-label="Numbers" />
                        </tr>
                      </thead>
                      <tbody>
                        {!list.length && (
                          <tr>
                            <td colSpan={cols.length + 3 + ["followers", "posted_on", "screenshot", "source", "status"].filter(hasDet).length} className="rp-mute">
                              No one matches this filter.
                            </td>
                          </tr>
                        )}
                        {list.map(({ r, p, key }) => {
                          const s = (p && p.stats) || {};
                          const shot = s.screenshot_url || (p && p.screenshot_url);
                          const has = cols.some(([k]) => s[k] != null);
                          return (
                            <tr key={key} className={p ? "" : "rp-miss"}>
                              <td>
                                <b>{nameOf(r)}</b>
                                {hasDet("profile_link") && handleOf(r) && (
                                  <a className="rp-sub c2-link" href={`https://instagram.com/${handleOf(r)}`} target="_blank" rel="noopener noreferrer">
                                    @{handleOf(r)} ↗
                                  </a>
                                )}
                                {hasDet("on_geek") && r.on_sheet && <small className="rp-sub">not on Geek OS yet</small>}
                              </td>
                              {hasDet("followers") && <td>{(r.creator || {}).followers != null ? num((r.creator || {}).followers) : "—"}</td>}
                              <td>
                                {!p ? (
                                  <span className="rp-mute">{kd === "story" ? "Not in yet" : "Not posted yet"}</span>
                                ) : p.permalink ? (
                                  <a className="c2-link" href={p.permalink} target="_blank" rel="noreferrer">
                                    {KIND_LABEL[kd]} ↗
                                  </a>
                                ) : (
                                  KIND_LABEL[kd]
                                )}
                              </td>
                              {hasDet("posted_on") && <td>{p && p.posted_at ? new Date(p.posted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</td>}
                              {cols.map(([k]) => (
                                <td key={k}>{p ? fmt(k, s[k]) : ""}</td>
                              ))}
                              {hasDet("screenshot") && (
                              <td>
                                {shot ? (
                                  <a href={abs(shot)} target="_blank" rel="noopener noreferrer" download title="Insights screenshot — open / download">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={abs(shot)} alt="Insights screenshot" className="rp-th" />
                                  </a>
                                ) : (
                                  <span className="rp-mute" title="No screenshot yet">—</span>
                                )}
                              </td>
                              )}
                              {hasDet("source") && <td>{p ? SRC_TXT(s) || "—" : ""}</td>}
                              {hasDet("status") && <td className="rp-st">{STAGE_TXT(r.stage)}</td>}
                              <td>
                                {!p ? (
                                  kd === "story" ? (
                                    <button type="button" className="rp-ins" onClick={() => addNums(r, null, "story")}>
                                      📸 Add story
                                    </button>
                                  ) : null
                                ) : canEdit(r, p) ? (
                                  <button type="button" className="rp-ins" onClick={() => addNums(r, p)} title="Add the insights screenshot — the numbers fill in on their own">
                                    {has ? "✏️ Update" : "📷 Add insights"}
                                  </button>
                                ) : (
                                  <span className="rp-mute" title="No post link yet">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </Panel>
      {toast}
      {askEl}

      <style>{`
        .rp-pick { margin: -4px 0 16px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--ad-line-2); background: #fafbff; }
        .rp-pick__t { margin: 0 0 8px; font-size: 12.5px; font-weight: 700; color: var(--ad-muted); }
        .rp-pick__row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; }
        .rp-pick__g { min-width: 84px; font-size: 12px; font-weight: 800; color: var(--ad-text); }
        .rp-tick { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 12.5px; font-weight: 700; color: var(--ad-muted); cursor: pointer; user-select: none; }
        .rp-tick input { width: 15px; height: 15px; accent-color: #6657e9; margin: 0; }
        .rp-tick.is-on { border-color: #6657e9; background: #f1efff; color: #3b2fc4; }
        .rp-pick__x { border: 0; background: none; padding: 0 4px; font-size: 12px; font-weight: 700; color: var(--ad-primary); cursor: pointer; }
        .rp-st { text-transform: capitalize; font-size: 12.5px; }
        .rp-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: -4px 0 16px; }
        .rp-chip { height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--ad-line-2); background: #fff; font-size: 13px; font-weight: 700; color: var(--ad-text); cursor: pointer; }
        .rp-chip:hover { border-color: #6657e9; }
        .rp-chip.is-on { background: #6657e9; border-color: #6657e9; color: #fff; }
        .rp-stats { margin-top: -8px; }
        .rp-note { margin-top: 16px; }
        .rp-t { margin-top: 12px; }
        .rp-sec + .rp-sec { margin-top: 26px; }
        .rp-h { margin: 22px 0 0; font-size: 16px; font-weight: 800; color: var(--ad-ink); }
        .rp-h span { margin-left: 6px; padding: 2px 9px; border-radius: 999px; background: #efedff; color: #6657e9; font-size: 12px; }
        .rp-q { margin-top: 18px; width: min(340px, 100%); height: 42px; }
        .rp-ins { border: 1px solid var(--ad-line-2); border-radius: 9px; background: #fff; padding: 6px 10px; font-size: 12px; font-weight: 800; color: #6657e9; white-space: nowrap; cursor: pointer; }
        .rp-ins:hover { border-color: var(--ad-primary); }
        .rp-mute { color: var(--ad-muted); font-size: 12px; }
        .rp-sub { display: block; font-size: 11px; color: var(--ad-muted); }
        .rp-t td { height: 48px; padding-top: 6px; padding-bottom: 6px; }
        .rp-miss td { background: #fcfbff; }
        .rp-th { width: 34px; height: 34px; object-fit: cover; border-radius: 7px; border: 1px solid var(--ad-line); display: block; }
        .rp-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .rp-foot { margin-top: 12px; font-size: 13px; }
      `}</style>
    </AdminShell>
  );
}
