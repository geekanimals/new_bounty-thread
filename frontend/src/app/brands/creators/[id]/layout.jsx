import { Suspense } from "react";
// Creator page: id = "p-<participation_id>" ya "i-<invite_id>" — build ke time ek sample page, asli id browser mein useParams se
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function CreatorLayout({ children }) {
  // Suspense: URL param browser mein milta hai — Next 16 build (cacheComponents) ko boundary chahiye
  return <Suspense fallback={null}>{children}</Suspense>;
}
