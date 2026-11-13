// Campaign ids asli (database se) hain — ek sample pehle se banta hai, baaki pehli baar khulne par.
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function CampaignWorkspaceLayout({ children }) {
  return children;
}
