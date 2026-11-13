// Creator (participation / invite) ids asli hain — ek sample pehle se banta hai, baaki pehli baar khulne par.
export function generateStaticParams() {
  return [{ cid: "sample" }];
}

export default function WorkspaceCreatorLayout({ children }) {
  return children;
}
