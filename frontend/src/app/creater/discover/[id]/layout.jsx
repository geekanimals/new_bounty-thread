// Campaign id asli (UUID) hai — sirf ek sample pehle se banta hai, baaki pehli baar khulne par (page client hai, useParams).
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function BriefLayout({ children }) {
  return children;
}
