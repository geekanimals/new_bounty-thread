// Decline page: id = asli id (campaign_id / participation_id) — build ke time ek sample page, asli id browser mein useParams se
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function DeclineLayout({ children }) {
  return children;
}
