// Creator profile (id = member id, database se) — pages pehli baar khulne par bante hain
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function CreatorLayout({ children }) {
  return children;
}
