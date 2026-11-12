import Hero from "@/components/home/Hero";
import TrustedBrands from "@/components/home/TrustedBrands";
import WhoItsFor from "@/components/home/WhoItsFor";
import HowItWorks from "@/components/home/HowItWorks";
import WatchDemo from "@/components/home/WatchDemo";
import MassBarter from "@/components/home/MassBarter";
import Pricing from "@/components/home/Pricing";
import Faq from "@/components/home/Faq";
import EarlyAccess from "@/components/home/EarlyAccess";

// Home page — saare sections yahin se order mein manage hote hain.
// Kisi section ko hatana / upar-niche karna ho to bas yahan line move karo.
export default function Home() {
  return (
    <>
      <Hero />
      <TrustedBrands />
      <WhoItsFor />
      <HowItWorks />
      <WatchDemo />
      <MassBarter />
      <Pricing />
      <Faq />
      <EarlyAccess />
    </>
  );
}
