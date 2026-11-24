/*
 * Instagram insights screenshot → numbers, in the browser (free OCR — Tesseract from jsDelivr, no API key).
 * Reel:  views, viewers (= reach), likes, comments, reposts, shares, saves, avg watch time, follows
 * Story: views, viewers (= reach), interactions, profile activity, followers %, replies, link clicks, sticker taps
 * Numbers are only suggested: the form shows them, the team checks and saves.
 */
const CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js";

// label (lowercase words, in order) → metric key. Longest phrases first.
const LABELS = [
  ["accounts reached", "reach"],
  ["average watch time", "avg_watch_s"],
  ["skip rate", "skip_rate_pct"],
  ["avg watch time", "avg_watch_s"],
  ["profile activity", "profile_visits"],
  ["profile visits", "profile_visits"],
  ["link sticker taps", "link_clicks"],
  ["link clicks", "link_clicks"],
  ["link taps", "link_clicks"],
  ["sticker taps", "sticker_taps"],
  ["sticker tap", "sticker_taps"],
  ["website taps", "link_clicks"],
  ["link tap", "link_clicks"],
  ["profile visit", "profile_visits"],
  ["next story", "next_story"],
  ["forward", "forward"],
  ["back", "back"],
  ["exited", "exited"],
  ["exits", "exited"],
  ["navigation", "navigation"],
  ["accounts engaged", "interactions"],
  ["content interactions", "interactions"],
  ["post interactions", "interactions"],
  ["viewers", "reach"],
  ["reach", "reach"],
  ["impressions", "impressions"],
  ["views", "views"],
  ["plays", "views"],
  ["interactions", "interactions"],
  ["follows", "follows"],
  ["followers", "followers_pct"],
  ["replies", "replies"],
  ["reactions", "replies"],
  ["shares", "shares"],
  ["sends", "shares"],
  ["likes", "likes"],
  ["comments", "comments"],
  ["reposts", "reposts"],
  ["saves", "saves"],
];
export const OCR_KEYS = [...new Set(LABELS.map((l) => l[1]))];

const clean = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9%.,:\-]/g, "");
// a thin second "1" is often read as " ' ` | l I → "11" comes out as 1" — turn those into 1 when they touch a digit
const fixOnes = (t) => String(t || "").trim().replace(/(?<=\d)["'`’”|lI]|["'`’”|lI](?=\d)/g, "1");
// "1,234" "12.5K" "1.2M" "97.1%" "7s" "1m 5s"(one token each) → number
function toNum(raw, key) {
  raw = fixOnes(raw);
  let t = String(raw || "").trim().replace(/^[^0-9OolI|]+/, "").replace(/[)\]]+$/, "");
  if (/^[OolI|]$/.test(t)) t = /[Oo]/.test(t) ? "0" : "1";
  t = t.replace(/(?<=\d)[Oo]|[Oo](?=\d)/g, "0");
  if (key === "avg_watch_s") {
    // "1m 4s" — bold text often comes out as "imd4s" / "1m4s" → i/l = 1, skip 1–2 stray letters (check this first)
    const f = String(raw || "").trim().replace(/[iIl|]/g, "1").match(/^(\d{1,2})m\D{0,2}(\d{1,2})s$/i);
    if (f) return Number(f[1]) * 60 + Number(f[2]);
    if (!/^\d/.test(String(raw || "").trim())) return null; // "xyz4s" → don't guess
    const m = t.match(/^(\d+(?:\.\d+)?)(s|sec)?$/i) || t.match(/^(\d+)m(\d+)?s?$/i);
    if (!m) return null;
    return m[2] && /^\d+$/.test(m[2]) ? Number(m[1]) * 60 + Number(m[2]) : t.match(/^(\d+)m/i) ? Number(m[1]) * 60 : Number(m[1]);
  }
  if (key === "followers_pct" || key === "skip_rate_pct") {
    const m = t.match(/^(\d{1,3}(?:\.\d{1,2})?)%$/);
    return m && Number(m[1]) <= 100 ? Number(m[1]) : null;
  }
  const m = t.replace(/,/g, "").match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!m) return null;
  return Math.round(Number(m[1]) * (m[2] ? (/k/i.test(m[2]) ? 1e3 : 1e6) : 1));
}
const isNumTok = (t) => /^[0-9][0-9.,]*[kKmM%s]?$/.test(fixOnes(t)) || /^[OolI|]$/.test(String(t).trim());

/** words: [{ text, conf, x0, y0, x1, y1 }] (one or more OCR passes, any order) → { metrics, kind } */
export function parseInsightWords(input, kind = "reel", width = 0) {
  // 1) duplicate words from two passes → keep the surest one
  const words = [];
  input
    .filter((w) => String(w.text || "").trim())
    // a lone "1" / "1s" whose box is far too wide for one digit is really "11" / "11s" (the thin second 1 got dropped)
    .map((w) => {
      const t = String(w.text).trim(),
        h = (w.y1 - w.y0) || 1,
        wd = w.x1 - w.x0;
      if (/^1s$/i.test(t) && wd > h * 1.6) return { ...w, text: "11s" };
      if (t === "1" && wd > h * 0.8) return { ...w, text: "11" };
      return w;
    })
    .filter((w) => !width || (w.x1 < width - 4 && w.x0 > 3)) // cut by the picture's edge (cropped screenshot) → don't trust it
    .sort((a, b) => (b.conf || 0) - (a.conf || 0))
    .forEach((w) => {
      const dup = words.find((o) => Math.abs(o.x0 - w.x0) < 12 && Math.abs(o.y0 - w.y0) < 12);
      if (!dup) return words.push({ ...w, t: clean(w.text) });
      // one pass read "5s", another "Bs" at the same spot → the number wins
      if (!isNumTok(dup.text) && !/[a-z]{3,}/i.test(dup.text) && isNumTok(w.text) && (w.conf || 0) >= 50) return Object.assign(dup, { ...w, t: clean(w.text) });
      // same spot read twice: thin "11" often comes out as "1" in one pass → keep the longer number
      const a = String(dup.text).trim(),
        b = String(w.text).trim();
      const fa = fixOnes(a),
        fb = fixOnes(b);
      // only when the longer one is the same number with an extra "1" ("1" → "11"), never a different number ("90" ≠ "920")
      const da = fa.replace(/\D/g, ""),
        db = fb.replace(/\D/g, "");
      if (/^\d[\d,.]*$/.test(fa) && /^\d[\d,.]*$/.test(fb) && db.length > da.length && db.replace(/1/g, "") === da.replace(/1/g, "") && (w.conf || 0) >= 20) Object.assign(dup, { ...w, t: clean(w.text) });
    });
  // 2) lines (same height band)
  words.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
  const lines = [];
  words.forEach((w) => {
    const h = w.y1 - w.y0;
    const cy = (w.y0 + w.y1) / 2;
    const ln = lines.find((l) => Math.abs(l.cy - cy) < Math.max(10, h * 0.6));
    if (ln) ln.words.push(w);
    else lines.push({ cy, h, words: [w] });
  });
  lines.forEach((l) => l.words.sort((a, b) => a.x0 - b.x0));
  lines.sort((a, b) => a.cy - b.cy);
  const all = lines.flatMap((l) => l.words);
  const text = all.map((w) => w.t).join(" ");
  if (/reel/.test(text) && /insights/.test(text)) kind = "reel";

  const m = {};
  const used = new Set();
  // one screenshot with a "reel" block and a "story" block (Bounty app) → read only the one asked for
  // a block heading = a short line starting with "reel" / "story" with a row of numbers just under it (Bounty app's own cards)
  const numRow = (l) => l && l.words.length >= 2 && l.words.every((w) => isNumTok(w.text.trim()) && !/[%:]/.test(w.text));
  const head = (word) =>
    lines.findIndex((l, i) => l.words[0] && l.words[0].t.replace(/[^a-z]/g, "") === word && l.words.length <= 8 && (l.words.some((w) => /posted/.test(w.t)) || lines.slice(i + 1, i + 4).some(numRow)));
  const hr = head("reel"),
    hs = head("story");
  let scan = lines;
  if (hr >= 0 && hs >= 0) scan = kind === "story" ? lines.slice(hs) : hr < hs ? lines.slice(hr, hs) : lines.slice(hr);
  const inScan = new Set(scan.flatMap((l) => l.words));
  all.splice(0, all.length, ...all.filter((w) => inScan.has(w)));
  // 3) "Label  value" (same row, value to the right) or "Label" with the value just below it (cards)
  scan.forEach((ln) => {
    const ws = ln.words;
    for (let i = 0; i < ws.length; i++) {
      const hit = LABELS.find(([ph]) => {
        const p = ph.split(" ");
        return p.every((x, j) => ws[i + j] && ws[i + j].t.replace(/[^a-z]/g, "") === x);
      });
      if (!hit) continue;
      const [ph, k0] = hit;
      const key = kind === "story" && k0 === "comments" ? "replies" : k0; // a story's "Comments" are its replies
      const n = ph.split(" ").length;
      const prev = ws[i - 1] && ws[i - 1].t.replace(/[^a-z]/g, "");
      const next = ws[i + n] && ws[i + n].t.replace(/[^a-z]/g, "");
      if (key === "followers_pct" && (prev === "non" || /^non/.test(ws[i].t))) continue; // "Non-followers"
      if (key === "followers_pct") {
        // the % under "Interactions" is the followers' share of interactions, not of views → skip it
        const above = lines.filter((l) => l.cy < ln.cy);
        const lastOf = (word) => above.reduce((y, l) => (l.words.some((w) => w.t.replace(/[^a-z]/g, "") === word) ? l.cy : y), -1);
        if (lastOf("interactions") > lastOf("views") && lastOf("interactions") > lastOf("viewers")) continue;
      }
      if (next === "over" || next === "by") continue; // "Views over time" chart title
      if (m[key] != null) continue; // first (top-most) one wins
      const L = { x0: ws[i].x0, x1: ws[i + n - 1].x1, y0: Math.min(...ws.slice(i, i + n).map((w) => w.y0)), y1: Math.max(...ws.slice(i, i + n).map((w) => w.y1)) };
      const lh = L.y1 - L.y0 || 20;
      // same row → nearest number to the right (no other label in between)
      let val = null;
      for (let j = i + n; j < ws.length; j++) {
        const t = ws[j].text.trim();
        if (isNumTok(t)) {
          const v = toNum(t, key);
          if (v != null) val = { v, w: ws[j] };
          break;
        }
        if (/[a-z]{3,}/i.test(t)) break; // next label starts
      }
      // below (card layout): number under the label, same column, within ~3 rows
      // (navigation rows — Forward / Back / Exited / Next story — always have their number on the same row)
      if (!val && !["forward", "back", "exited", "next_story", "navigation"].includes(key)) {
        // number under the label (Instagram cards) or just above it (Bounty app cards) — the closer one wins
        const col = (w) => w.x0 > L.x0 - lh * 2 && w.x0 < L.x0 + Math.max(L.x1 - L.x0, lh * 4) && (isNumTok(w.text.trim()) || key === "avg_watch_s");
        const gap = (w) => (w.y0 >= L.y1 - 2 ? w.y0 - L.y1 : L.y0 - w.y1);
        const below = all
          .filter((w) => !used.has(w) && col(w) && ((w.y0 > L.y1 - 2 && w.y0 - L.y1 < lh * 3.5) || (w.y1 < L.y0 + 2 && L.y0 - w.y1 < lh * 1.6)))
          .sort((a, b) => gap(a) - gap(b) || Math.abs(a.x0 - L.x0) - Math.abs(b.x0 - L.x0));
        for (const w of below) {
          let v = toNum(w.text, key);
          // "1m" + "4s" read as two words → add them up
          if (v != null && key === "avg_watch_s" && /^\d+m$/i.test(w.text.trim())) {
            const sec = all.find((o) => o !== w && Math.abs(o.y0 - w.y0) < lh && o.x0 > w.x1 && o.x0 - w.x1 < lh * 2 && /^\d{1,2}s$/i.test(o.text.trim()));
            if (sec) v += Number(sec.text.trim().slice(0, -1));
          }
          if (v != null) {
            val = { v, w };
            break;
          }
        }
      }
      if (val) {
        m[key] = val.v;
        used.add(val.w);
      }
    }
  });
  // 4) reel / post: the icon row under the thumbnail = ❤️ 💬 🔁 ✈️ 🔖 (5 numbers) or ❤️ 💬 ✈️ 🔖 (4), no words in that row
  // Bounty app card (labels too small / light to read): numbers always come in the same order
  //   row 1 = Views · Reach · Likes   ·   row 2 = Comments · Shares · Saves (a story's comments are its replies)
  if (Object.keys(m).length < 2 && (hr >= 0 || hs >= 0)) {
    const start = kind === "story" && hs >= 0 ? hs : hr >= 0 ? hr : hs;
    const next = [hr, hs].filter((x) => x > start).sort((a, b) => a - b)[0];
    const rows = lines.slice(start + 1, next > start ? next : lines.length).filter(numRow).slice(0, 2);
    const order = [["views", "reach", "likes"], [kind === "story" ? "replies" : "comments", "shares", "saves"]];
    rows.forEach((r, ri) => r.words.slice(0, 3).forEach((w, ci) => {
      const v = toNum(w.text, "likes");
      if (v != null && m[order[ri][ci]] == null) m[order[ri][ci]] = v;
    }));
  }
  if (kind !== "story") {
    const stop = lines.findIndex((l) => l.words.some((w) => /^(overview|summary|engagement)$/.test(w.t.replace(/[^a-z]/g, ""))));
    const row = lines
      .slice(0, stop > 0 ? stop : lines.length)
      .filter((l) => l.words.length >= 4 && l.words.length <= 6 && l.words.every((w) => isNumTok(w.text.trim()) && !/[%:]/.test(w.text)))
      .pop();
    if (row) {
      const vals = row.words.map((w) => toNum(w.text, "likes"));
      const keys = vals.length >= 5 ? ["likes", "comments", "reposts", "shares", "saves"] : ["likes", "comments", "shares", "saves"];
      keys.forEach((k, i) => vals[i] != null && m[k] == null && (m[k] = vals[i]));
    }
  }
  return { metrics: m, kind };
}

let workerP = null;
async function getWorker() {
  if (typeof window === "undefined") throw new Error("browser only");
  if (!window.Tesseract) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = CDN;
      s.onload = res;
      s.onerror = () => rej(new Error("Couldn't load the screenshot reader — check the internet and try again."));
      document.head.appendChild(s);
    });
  }
  if (!workerP) workerP = window.Tesseract.createWorker("eng").catch((e) => ((workerP = null), Promise.reject(e)));
  return workerP;
}

// dark-mode screenshots → black text on white, 2× bigger, sharp black / white
async function prepare(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("That file isn't an image we can read."));
      i.src = url;
    });
    // always ~2× (thin "11" is only read right at 2×); very big pictures are capped so the browser stays quick
    const scale = Math.min(2, 3600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const dark = sum / (px.length / 4) < 110;
    // cut-off from the picture's own background (white / cream / black apps) so light-grey labels survive
    const hist = new Uint32Array(256);
    for (let i = 0; i < px.length; i += 16) {
      const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      hist[Math.round(dark ? 255 - y : y)]++;
    }
    let acc = 0,
      bg = 255;
    const half = hist.reduce((a, b) => a + b, 0) / 2;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= half) {
      bg = v;
      break;
    }
    const cut = dark ? 150 : Math.max(150, Math.min(215, bg - 38)); // dark apps: fixed (proven) · light / cream apps: from their background
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i],
        gg = px[i + 1],
        b = px[i + 2];
      let y = 0.299 * r + 0.587 * gg + 0.114 * b;
      if (dark) y = 255 - y;
      // coloured pixels (pink / purple rings, emoji, blue icons) are never the numbers → background
      const v = Math.max(r, gg, b) - Math.min(r, gg, b) > 80 ? 255 : y > cut ? 255 : 0;
      px[i] = px[i + 1] = px[i + 2] = v;
    }
    // plain copy too (grey, light text turned dark) — thin digits survive here when black/white loses them
    const plain = document.createElement("canvas");
    plain.width = c.width;
    plain.height = c.height;
    const pg = plain.getContext("2d");
    pg.filter = dark ? "invert(1) grayscale(1) contrast(1.4)" : "grayscale(1) contrast(1.4)";
    pg.drawImage(img, 0, 0, c.width, c.height);
    g.putImageData(d, 0, 0);
    return [c, plain];
  } finally {
    URL.revokeObjectURL(url);
  }
}

const wordsOf = (data) => {
  const out = [];
  (data.blocks || []).forEach((b) => (b.paragraphs || []).forEach((p) => (p.lines || []).forEach((l) => (l.words || []).forEach((w) => out.push({ text: w.text, conf: w.confidence, ...w.bbox }))))); // prettier-ignore
  return out;
};

/** File → { metrics, kind } (throws with a readable message) */
export async function readInsightsOcr(file, kind = "reel") {
  if (!file || !/^image\//.test(file.type || "image/")) throw new Error("Pick a screenshot (image).");
  const [w, [bw, plain]] = await Promise.all([getWorker(), prepare(file)]);
  const words = [];
  for (const [canvas, psm] of [[bw, "6"], [bw, "11"], [plain, "6"]]) {
    await w.setParameters({ tessedit_pageseg_mode: psm });
    const r = await w.recognize(canvas, {}, { blocks: true });
    words.push(...wordsOf(r.data));
  }
  return parseInsightWords(words, kind, bw.width);
}
