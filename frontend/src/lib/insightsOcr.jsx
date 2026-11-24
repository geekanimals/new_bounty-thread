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
  ["avg watch time", "avg_watch_s"],
  ["profile activity", "profile_visits"],
  ["profile visits", "profile_visits"],
  ["link sticker taps", "link_clicks"],
  ["link clicks", "link_clicks"],
  ["link taps", "link_clicks"],
  ["sticker taps", "sticker_taps"],
  ["viewers", "reach"],
  ["reach", "reach"],
  ["impressions", "impressions"],
  ["views", "views"],
  ["plays", "views"],
  ["interactions", "interactions"],
  ["follows", "follows"],
  ["followers", "followers_pct"],
  ["replies", "replies"],
  ["likes", "likes"],
  ["comments", "comments"],
  ["reposts", "reposts"],
  ["shares", "shares"],
  ["saves", "saves"],
];
export const OCR_KEYS = [...new Set(LABELS.map((l) => l[1]))];

const clean = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9%.,:\-]/g, "");
// "1,234" "12.5K" "1.2M" "97.1%" "7s" "1m 5s"(one token each) → number
function toNum(raw, key) {
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
  if (key === "followers_pct") {
    const m = t.match(/^(\d{1,3}(?:\.\d)?)%$/);
    return m ? Number(m[1]) : null;
  }
  const m = t.replace(/,/g, "").match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!m) return null;
  return Math.round(Number(m[1]) * (m[2] ? (/k/i.test(m[2]) ? 1e3 : 1e6) : 1));
}
const isNumTok = (t) => /^[0-9][0-9.,]*[kKmM%s]?$/.test(String(t).trim()) || /^[OolI|]$/.test(String(t).trim());

/** words: [{ text, conf, x0, y0, x1, y1 }] (one or more OCR passes, any order) → { metrics, kind } */
export function parseInsightWords(input, kind = "reel") {
  // 1) duplicate words from two passes → keep the surest one
  const words = [];
  input
    .filter((w) => String(w.text || "").trim())
    .sort((a, b) => (b.conf || 0) - (a.conf || 0))
    .forEach((w) => {
      const dup = words.find((o) => Math.abs(o.x0 - w.x0) < 12 && Math.abs(o.y0 - w.y0) < 12);
      if (!dup) words.push({ ...w, t: clean(w.text) });
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
  // 3) "Label  value" (same row, value to the right) or "Label" with the value just below it (cards)
  lines.forEach((ln) => {
    const ws = ln.words;
    for (let i = 0; i < ws.length; i++) {
      const hit = LABELS.find(([ph]) => {
        const p = ph.split(" ");
        return p.every((x, j) => ws[i + j] && ws[i + j].t.replace(/[^a-z]/g, "") === x);
      });
      if (!hit) continue;
      const [ph, key] = hit;
      const n = ph.split(" ").length;
      const prev = ws[i - 1] && ws[i - 1].t.replace(/[^a-z]/g, "");
      const next = ws[i + n] && ws[i + n].t.replace(/[^a-z]/g, "");
      if (key === "followers_pct" && (prev === "non" || /^non/.test(ws[i].t))) continue; // "Non-followers"
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
      if (!val) {
        const below = all
          .filter((w) => !used.has(w) && w.y0 > L.y1 - 2 && w.y0 - L.y1 < lh * 3.5 && w.x0 > L.x0 - lh * 1.5 && w.x0 < L.x0 + Math.max(L.x1 - L.x0, lh * 4) && (isNumTok(w.text.trim()) || key === "avg_watch_s"))
          .sort((a, b) => a.y0 - b.y0 || Math.abs(a.x0 - L.x0) - Math.abs(b.x0 - L.x0));
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
    const scale = Math.min(2, 2600 / Math.max(img.width, img.height));
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
    for (let i = 0; i < px.length; i += 4) {
      let y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      if (dark) y = 255 - y;
      const v = y > (dark ? 150 : 165) ? 255 : 0;
      px[i] = px[i + 1] = px[i + 2] = v;
    }
    g.putImageData(d, 0, 0);
    return c;
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
  const [w, canvas] = await Promise.all([getWorker(), prepare(file)]);
  const words = [];
  for (const psm of ["6", "11"]) {
    await w.setParameters({ tessedit_pageseg_mode: psm });
    const r = await w.recognize(canvas, {}, { blocks: true });
    words.push(...wordsOf(r.data));
  }
  return parseInsightWords(words, kind);
}
