"use client";

/**
 * Reports / downloads — purane brand-portal.js csvDownload / campCsv / campPdf / data-bpxcsvall jaisa.
 * Excel = CSV (BOM + CRLF, Excel seedha khol leta hai); PDF = print window (Save as PDF).
 */
import { loadBrandCampaign, loadCampaignAnalytics } from "./campaigns";
import { B_TYPE, B_STATUS, B_STEPS, bNum, bDate } from "./shape";

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** CSV file download (purana csvDownload) */
export function downloadCsv(name, rows) {
  const s = rows
    .map((r) =>
      r
        .map((v) => {
          v = v == null ? "" : String(v);
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        })
        .join(",")
    )
    .join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + s], { type: "text/csv;charset=utf-8" }));
  a.download = name.replace(/[^\w\- ]+/g, "").trim() + ".csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

/** Ek campaign ka Excel (purana campCsv: brand_campaign + campaign_analytics) → { error } */
export async function campaignCsv(id) {
  const d = await loadBrandCampaign(id);
  if (d.error) return { error: d.error };
  const a = await loadCampaignAnalytics(id);
  const byU = {};
  (((a && a.data) || {}).creators || []).forEach((r) => {
    const u = ((r.creator || {}).username || "").toLowerCase();
    if (u) byU[u] = r;
  });
  const rows = [["Creator", "Instagram", "Followers", "City", "Status", "Video", "Post links", "Views", "Reach", "Likes", "Comments", "Shares", "Saves"]];
  ((d.data || {}).creators || []).forEach((x) => {
    const c = x.creator || {};
    const q = (byU[(c.username || "").toLowerCase()] || {}).totals || {};
    rows.push([
      c.name || "",
      c.username ? "@" + c.username : "",
      c.followers,
      c.city,
      (x.status || {}).label,
      (x.video || {}).url || "",
      (x.posts || [])
        .map((p) => p.permalink)
        .filter(Boolean)
        .join(" "),
      q.views,
      q.reach,
      q.likes,
      q.comments,
      q.shares,
      q.saves,
    ]);
  });
  downloadCsv(((d.data || {}).campaign || {}).name + " - report", rows);
  return { error: null };
}

/**
 * Ek campaign ki PDF report (purana campPdf) — window click par turant khulti hai (pop-up blocker), phir bharti hai.
 * → { error }
 */
export async function campaignPdf(id) {
  const w = window.open("", "_blank");
  if (!w) return { error: { message: "Allow pop-ups to download the PDF." } };
  w.document.write("<p style='font:14px sans-serif;padding:20px'>Preparing the report…</p>");
  const d = await loadBrandCampaign(id);
  if (d.error) {
    w.close();
    return { error: d.error };
  }
  const a = await loadCampaignAnalytics(id);
  const c = d.data.campaign || {};
  const an = (a && a.data) || {};
  const t = an.totals || {};
  const R = (an.creators || []).filter((r) => (r.posts || []).length);
  const k = {};
  (d.data.creators || []).forEach((x) => {
    const s = (x.status || {}).key;
    k[s] = (k[s] || 0) + 1;
  });
  const box = (v, l) => '<div class="k"><b>' + esc(bNum(v)) + "</b><span>" + esc(l) + "</span></div>";
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><title>' +
    esc(c.name) +
    " — campaign report</title><style>" +
    "body{font:13px/1.45 Inter,Arial,sans-serif;color:#111;margin:28px}h1{font-size:22px;margin:0}h2{font-size:15px;margin:22px 0 8px}.m{color:#666}" +
    ".ks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.k{border:1px solid #ddd;border-radius:8px;padding:10px}.k b{display:block;font-size:18px}.k span{color:#666;font-size:12px}" +
    "table{width:100%;border-collapse:collapse;margin-top:6px}th,td{border-bottom:1px solid #e5e5e5;padding:6px 4px;text-align:left;font-size:12px}th{background:#f6f6f8}" +
    ".foot{margin-top:24px;color:#888;font-size:11px}@media print{.np{display:none}}</style></head><body>" +
    '<div class="np" style="margin-bottom:14px"><button onclick="print()" style="padding:8px 14px;font-weight:700">Save as PDF / Print</button></div>' +
    "<h1>" +
    esc(c.name) +
    '</h1><div class="m">' +
    esc(c.brand || "") +
    " · " +
    esc(B_TYPE[c.campaign_type] || "") +
    (c.product ? " · " + esc(c.product) : "") +
    " · " +
    bDate(c.starts_on) +
    " – " +
    bDate(c.ends_on) +
    "</div>" +
    '<h2>Results</h2><div class="ks">' +
    box(t.creators_live, "Creators posted") +
    box(t.posts, "Posts") +
    box(t.followers, "Followers reached") +
    box(t.views, "Views") +
    box(t.reach, "Reach") +
    box(t.likes, "Likes") +
    box(t.comments, "Comments") +
    box((Number(t.shares) || 0) + (Number(t.saves) || 0), "Shares + saves") +
    "</div>" +
    '<h2>Progress</h2><div class="ks">' +
    B_STEPS.map((s) => box(s[0] === "shipped" ? (k.shipped || 0) + (k.making || 0) : k[s[0]] || 0, s[1])).join("") +
    "</div>" +
    "<h2>Creators who posted</h2>" +
    (R.length
      ? "<table><thead><tr><th>Creator</th><th>Followers</th><th>Posts</th><th>Views</th><th>Reach</th><th>Likes</th><th>Comments</th><th>Links</th></tr></thead><tbody>" +
        R.map((r) => {
          const cr = r.creator || {};
          const q = r.totals || {};
          return (
            "<tr><td>" +
            esc(cr.username ? "@" + cr.username : cr.name || "") +
            "</td><td>" +
            bNum(cr.followers) +
            "</td><td>" +
            (r.posts || []).length +
            "</td><td>" +
            bNum(q.views) +
            "</td><td>" +
            bNum(q.reach) +
            "</td><td>" +
            bNum(q.likes) +
            "</td><td>" +
            bNum(q.comments) +
            "</td><td>" +
            (r.posts || [])
              .filter((p) => p.permalink)
              .map((p) => '<a href="' + esc(p.permalink) + '">' + esc(p.media_type || "post") + "</a>")
              .join(" ") +
            "</td></tr>"
          );
        }).join("") +
        "</tbody></table>"
      : '<div class="m">No posts yet.</div>') +
    '<div class="foot">Geek OS · report made ' +
    new Date().toLocaleString("en-IN") +
    "</div></body></html>";
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* ignore */
    }
  }, 600);
  return { error: null };
}

/** Sab campaigns ek CSV mein (purana data-bpxcsvall) */
export async function allCampaignsCsv(campaigns, brand) {
  const rows = [["Campaign", "Status", "Creators posted", "Posts", "Followers reached", "Views", "Reach", "Likes", "Comments", "Shares", "Saves"]];
  for (const c of campaigns) {
    const a = await loadCampaignAnalytics(c.campaign_id);
    const t = ((a && a.data) || {}).totals || {};
    rows.push([c.name, B_STATUS[c.status] || c.status || "", t.creators_live, t.posts, t.followers, t.views, t.reach, t.likes, t.comments, t.shares, t.saves]);
  }
  downloadCsv("Geek campaigns - " + (brand || "your brand"), rows);
  return { error: null };
}
