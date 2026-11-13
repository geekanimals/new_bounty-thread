"use client";

import { useEffect } from "react";

/**
 * Purane app ke links ka router.
 * WhatsApp / email / short links mein purane URL jaate the: /app.html?door=…&go=…, ?cinv=…, ?apply=…,
 * aur Instagram / Facebook / Razorpay se wapsi (?code=…&state=…). next.config.mjs /app.html ko yahan bhejta hai
 * (URL wahi rehta hai) — ye page dekh ke sahi naye page par bhej deta hai. Koi link nahi tootega.
 */

// purane door names → naya panel
const DOOR = { superadmin: "admin", admin: "admin", agency: "owner", owner: "owner", brand: "brand", brands: "brand", creator: "creator", creators: "creator" };

// ?go=<page> — purane page naam → naye route (door ke hisaab se)
const GO = {
  creator: {
    dashboard: "/creator/home", home: "/creator/home", mycampaigns: "/creator/my-campaigns", campaigns: "/creator/my-campaigns", approvals: "/creator/my-campaigns",
    campaignops: "/creator/my-campaigns", opencampaigns: "/creator/discover", marketplace: "/creator/discover", mediakit: "/creator/media-kit",
    profile: "/creator/profile", onboarding: "/creator/profile", alerts: "/creator/home", messages: "/creator/messages", payments: "/creator/payments", settings: "/creator/settings",
  },
  brand: {
    dashboard: "/brands/dashboard", approvals: "/brands/approvals", campaigns: "/brands/campaigns", reports: "/brands/reports", billing: "/brands/billing",
    discover: "/brands/discovery", saved: "/brands/saved", creators: "/brands/saved", settings: "/brands/settings", alerts: "/brands/notifications", facebook: "/brands/facebook", instagram: "/brands/instagram",
  },
  admin: {
    overview: "/admin/overview", dashboard: "/admin/overview", alerts: "/admin/overview", approvals: "/admin/action-queue", signups: "/admin/action-queue/signups",
    applications: "/admin/applications", campaigns: "/admin/campaigns", campaignops: "/admin/campaigns", logistics: "/admin/logistics", creators: "/admin/creators",
    discover: "/admin/discovery", discovery: "/admin/discovery", brands: "/admin/brands", upload: "/admin/creator-upload", inbox: "/admin/inbox",
    messaging: "/admin/messaging", reports: "/admin/reports", activity: "/admin/activity", users: "/admin/users", settings: "/admin/settings", links: "/admin/settings/link-shortener",
  },
};
const HOME = { creator: "/creator", brand: "/brands", admin: "/admin", owner: "/" };

export default function LegacyRouter() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const roundTrip = ["code", "state", "error", "error_description", "error_reason"].some((k) => q.has(k));
    let door = DOOR[(q.get("door") || "").toLowerCase()];
    // Instagram / Facebook / payment se wapsi → wahi door jisne shuru kiya tha
    if (!door && roundTrip) {
      try {
        door = sessionStorage.getItem("geek_tab_door") || "";
      } catch {
        /* ignore */
      }
    }
    if (!["creator", "brand", "admin", "owner"].includes(door)) door = "creator";

    const keep = new URLSearchParams();
    let to = HOME[door];

    const go = q.get("go");
    if (go) {
      if (/^admin:/.test(go)) {
        door = "admin";
        to = GO.admin[go.split(":")[1]] || "/admin/overview";
      } else to = GO[door]?.[go] || HOME[door];
    }
    // campaign invite (WhatsApp / email): creator signup + campaign
    if (q.get("cinv")) {
      try {
        localStorage.setItem("geek_cinv", q.get("cinv"));
      } catch {
        /* ignore */
      }
      to = "/creator";
      keep.set("cinv", q.get("cinv"));
    }
    // public explore page se "Apply"
    if (q.get("apply")) to = `/creator/discover/${encodeURIComponent(q.get("apply"))}`;
    // Razorpay billing se wapsi
    if (q.get("rzpbill")) {
      to = "/brands/billing";
      keep.set("rzpbill", q.get("rzpbill"));
    }
    // OAuth wapsi: code/state as-is aage
    if (roundTrip) ["code", "state", "error", "error_description", "error_reason"].forEach((k) => q.has(k) && keep.set(k, q.get(k)));
    ["t", "invite", "from"].forEach((k) => q.has(k) && keep.set(k, q.get(k)));

    const qs = keep.toString();
    window.location.replace(to + (qs ? `?${qs}` : "") + window.location.hash);
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fcfdef", color: "#6b6d5c", fontSize: 15 }}>
      Opening Geek…
    </main>
  );
}
