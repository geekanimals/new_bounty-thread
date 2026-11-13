// Video review: id = asli id (campaign_id / participation_id) — build ke time ek sample page, asli id browser mein useParams se
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function VideoLayout({ children }) {
  return children;
}
