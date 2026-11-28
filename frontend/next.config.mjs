/** @type {import('next').NextConfig} */

// Purane app (HTML) ke URLs — WhatsApp / email / Google mein pade hain, inme se koi nahi tootna chahiye.
// .html wale pages → naye page (permanent). /app.html → /legacy router (URL wahi rehta hai, query ke saath).
const OLD_PAGES = [
  ["/index.html", "/"],
  ["/contact.html", "/contact"],
  ["/privacy.html", "/privacy"],
  ["/terms.html", "/terms"],
  ["/refund.html", "/refund-cancellation"],
  ["/shipping.html", "/shipping-delivery"],
  ["/data-deletion.html", "/data-deletion"],
  ["/explore.html", "/creator/explore"],
  ["/unsubscribe.html", "/unsubscribe"],
  ["/creater", "/creator"],
  ["/creater/:path*", "/creator/:path*"],
  ["/creators", "/creator"],
  ["/brand", "/brands"],
];


// ---------- Security headers (har page par) ----------
// CSP: sirf apni site, Supabase, aur zaroori Google/YouTube/jsDelivr hi load ho sakte hain.
const SUPABASE = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://edibibytqfrrxfztukpm.supabase.co").replace(/\/+$/, "");
const SUPABASE_WS = SUPABASE.replace(/^https:/, "wss:");
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://cdn.jsdelivr.net`, // wasm: ffmpeg (browser mein); unsafe-eval sirf localhost dev mein (React dev ko chahiye) — live par kabhi nahi
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${SUPABASE} ${SUPABASE_WS} https://docs.google.com https://*.googleusercontent.com https://cdn.jsdelivr.net`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://docs.google.com https://drive.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// X-Frame-Options / X-Content-Type-Options / Referrer-Policy server (nginx) pehle se bhejta hai — dobara nahi.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const STRICT = process.env.NEXT_CACHE_COMPONENTS === "1";

const nextConfig = {
  // "X-Powered-By: Next.js" header band (kaunsa framework hai, ye bahar na dikhe)
  poweredByHeader: false,
  experimental: {
    agentFeedback: true,
  },
  // Cache Components (Next 16 ka strict mode) by default BAND hai — isse har [id]/[slug] page par build
  // "Suspense boundary" error deta tha. Band rehne par sab pages normal chalte hain, code baar baar nahi badalna padta.
  // Kabhi chalu karna ho to env mein NEXT_CACHE_COMPONENTS=1 daal do.
  // Explicit false zaroori hai: value na likho to Vercel ka build env ise apne aap chalu kar deta hai.
  cacheComponents: STRICT,
  partialPrefetching: STRICT,

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  async redirects() {
    return [
      ...OLD_PAGES.map(([source, destination]) => ({ source, destination, permanent: true })),
      // purana media kit: /p.html?u=<username> → /kit/<username>
      { source: "/p.html", has: [{ type: "query", key: "u", value: "(?<u>.+)" }], destination: "/kit/:u", permanent: true },
      // purana org page: /o.html?o=<slug> → /o/<slug>
      { source: "/o.html", has: [{ type: "query", key: "o", value: "(?<o>.+)" }], destination: "/o/:o", permanent: true },
    ];
  },

  async rewrites() {
    // /app.html?door=…&go=…&cinv=… → router page (sahi naye panel par bhejta hai)
    return [
      { source: "/app.html", destination: "/legacy" },
      // Instagram / Facebook login ki wapsi (Meta redirect URI)
      { source: "/auth/callback", destination: "/legacy" },
    ];
  },
};

export default nextConfig;
