// Bill ka page: id = invoice_id (Supabase) — build ke time ek sample page, asli id browser mein useParams se
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function BillLayout({ children }) {
  return children;
}
