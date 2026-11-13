/**
 * services/brand — Brand portal ka poora Supabase layer. Pages / components sirf yahin se import karein:
 *     import { useBrand, signIn, useInvoices, fdate } from "@/services/brand";
 * Koi page seedha sbFor / rpc / invoke nahi bulata. lib/supabase.jsx neeche ki plumbing hai.
 *
 * Har call purane brand-portal.js / login.js (brand door) ke usi function ka naya roop hai — wahi RPC / edge function, wahi args.
 *
 * Files:
 *   core.jsx       door "brand", sb(), call() (public.*), api() (api.*), fn() (edge function), ss (sessionStorage), must, errText
 *   auth.jsx       brand store (useBrand / getBrand / loadBrand / reloadPortal), login (password / Facebook / WhatsApp OTP),
 *                  password reset, signOut, gates (useBrandGate), track
 *   helpers.jsx    pure helpers — numbers / dates, campaign labels & steps, avatars, notification route, bill (invoice) HTML + print
 *   notifications.jsx  🔔 alerts store (get_my_notifications, har 20 sec), mark read / all read
 *   dashboard.jsx  dashboard totals (campaign_analytics), top posts (brand_top_posts), post-thumb
 *   billing.jsx    bills (brand_invoices), Razorpay pay / check (brand-billing), ?rzpbill wapsi
 *   creators.jsx   creator profile card (brand_creator_card), ⭐ save (brand_favorite_set), saved list (brand_favorites)
 *   discovery.jsx  creator search (creator_search), ig-discover lookup, shortlist picks, campaign brief, Facebook search connect
 *   account.jsx    Settings: team (brand_team + brand-login), Facebook business link / refresh / unlink (brand-fb-login)
 *   shape.jsx      R2 pure helpers (b… naam) — campaign / stage labels, numbers, gradients, campaign card + hero shape, video embed
 *   approvals.jsx  creators approve / decline (org_decide_applicant), videos (bp_review_video), bulk approve, rejection_reasons
 *   campaigns.jsx  campaign list / detail (brand_campaign), analytics + top posts (dashboard cache), track_report, campaign request (brand_campaign_request)
 *   reports.jsx    Excel (CSV) + PDF downloads — campCsv / campPdf / sab campaigns ka CSV
 *   facebook.jsx   brand-facebook: Pages, posts, comments (reply / hide / delete), publish / schedule, insights, ads (pause / resume)
 *   instagram.jsx  brand ka Instagram (brand_portal.facebook.pages[].instagram), refresh
 *
 * Return ka rule: reads / actions → { data, error } (throw nahi); hooks → { data | list, loading, error, reload };
 * login writes (signIn / verifyOtp) → Error throw (login page try/catch karke message dikhata hai).
 */
export * from "./core";
export * from "./auth";
export * from "./helpers";
export * from "./notifications";
export * from "./dashboard";
export * from "./billing";
export * from "./creators";
export * from "./discovery";
export * from "./account";
export * from "./shape";
export * from "./approvals";
export * from "./campaigns";
export * from "./reports";
export * from "./facebook";
export * from "./instagram";
