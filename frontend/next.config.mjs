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
  ["/superadmin", "/admin"],
];

const STRICT = process.env.NEXT_CACHE_COMPONENTS === "1";

const nextConfig = {
  experimental: {
    agentFeedback: true,
  },
  // Cache Components (Next 16 ka strict mode) by default BAND hai — isse har [id]/[slug] page par build
  // "Suspense boundary" error deta tha. Band rehne par sab pages normal chalte hain, code baar baar nahi badalna padta.
  // Kabhi chalu karna ho to env mein NEXT_CACHE_COMPONENTS=1 daal do.
  // Explicit false zaroori hai: value na likho to Vercel ka build env ise apne aap chalu kar deta hai.
  cacheComponents: STRICT,
  partialPrefetching: STRICT,

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
    return [{ source: "/app.html", destination: "/legacy" }];
  },
};

export default nextConfig;
