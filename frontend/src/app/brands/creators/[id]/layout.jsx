// Creator page: id = "p-<participation_id>" ya "i-<invite_id>" — build ke time ek sample page, asli id browser mein useParams se
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function CreatorLayout({ children }) {
  return children;
}
