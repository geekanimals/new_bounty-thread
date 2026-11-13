// Brand ids asli UUID hain (database se) — sirf ek sample pehle se banta hai, baaki khulne par (Next cacheComponents)
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function BrandLayout({ children }) {
  return children;
}
