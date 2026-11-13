import { Suspense } from "react";
// Bill ka page: id = invoice_id (Supabase) — build ke time ek sample page, asli id browser mein useParams se
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function BillLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
