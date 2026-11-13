"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { TargetFields, MessagePreview, UploadBar, UploadedCreators, cuLoad, cuSave } from "@/components/admin/creator/UploadParts";

/* Creator upload — step 1: brand / campaign chuno, message dekho, sheet do (Figma 071) */
export default function CreatorUpload() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [camp, setCamp] = useState("");

  useEffect(() => {
    const s = cuLoad();
    if (s) {
      setBrand(s.brand || "");
      setCamp(s.camp || "");
    }
  }, []);

  // sheet padh li → step 2 (columns milao)
  const load = (sheet) => {
    cuSave({ brand, camp, sheet, send: true });
    router.push("/admin/creator-upload/match");
  };

  return (
    <AdminShell>
      <PageHead title="Creator upload" sub="Add creators who aren’t on Geek OS yet and invite them to the live campaigns." />
      <section className="ga-card cu1-card">
        <h2 className="ga-h2">📥 Creator upload</h2>
        <p className="cu1-intro">
          Each creator is saved to your creator pool (and Discovery) and gets a WhatsApp + email inviting them to<b>explore the live campaigns</b>— no login needed to look. When they tap <b>Apply</b>they sign in with WhatsApp, connect Instagram and the normal campaign flow carries on. Anyone already on Geek OS is matched by WhatsApp, email or Instagram and isn’t messaged.
        </p>
        <div className="cu1-fields">
          <TargetFields brand={brand} camp={camp} onBrand={setBrand} onCamp={setCamp} />
        </div>
        <MessagePreview brand={brand} camp={camp} />
        <UploadBar onLoad={load} />
      </section>
      <UploadedCreators brand={brand} />
      <style>{`
        .cu1-card { padding: 25px 22px 21px; }
        .cu1-intro { margin-top: 20px; font-size: 12px; line-height: 1.55; color: var(--ad-muted); }
        .cu1-intro b { font-weight: 700; margin: 0 2px; }
        .cu1-fields { margin-top: 15px; }
        @media (max-width: 640px) { .cu1-card { padding: 18px 16px; } }
      `}</style>
    </AdminShell>
  );
}
