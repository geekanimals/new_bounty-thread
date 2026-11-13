// Visitor ka andaaza location (Vercel edge headers se) — short link clicks ke saath jata hai.
// Koi third-party lookup nahi, yahan kuch save nahi hota. (Live app ke /api/geo jaisa hi.)
export function GET(req) {
  const h = (k) => {
    try {
      return decodeURIComponent(req.headers.get(k) || "") || null;
    } catch {
      return null;
    }
  };
  return Response.json(
    { city: h("x-vercel-ip-city"), region: h("x-vercel-ip-country-region"), country: h("x-vercel-ip-country") },
    { headers: { "Cache-Control": "no-store" } }
  );
}
