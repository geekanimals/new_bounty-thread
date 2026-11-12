"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { TargetFields, MessagePreview, UploadBar, UploadedCreators, NO_BRAND, NO_CAMP, cuLoad, cuSave } from "@/components/admin/creator/UploadParts";

/* Creator upload — step 3: creators add ho gaye, form khaali, naye upload ke liye taiyaar (Figma 073) */
export default function CreatorUploadDone() {
  const router = useRouter();
  const [brand, setBrand] = useState(NO_BRAND);
  const [camp, setCamp] = useState(NO_CAMP);
  const [res, setRes] = useState({ added: 18, invited: 18 });

  useEffect(() => {
    const s = cuLoad();
    if (s?.added) setRes({ added: s.added, invited: s.invited });
  }, []);

  const load = (file) => {
    cuSave({ brand, camp, file });
    router.push("/admin/creator-upload/match");
  };

  return (
    <AdminShell>
      <PageHead title="Creator upload" sub="Add creators who aren’t on Geek OS yet and invite them to the live campaigns." />
      <p className="cu3-ok">
        <span>✓</span>
        <span>
          <b>{res.added} new creators added</b>· {res.invited} invited to explore campaigns · 4 already uploaded (details updated) · 2 already on Geek OS · 2 skipped
        </span>
      </p>
      <section className="ad-card cu3-card">
        <h2 className="ad-h2">📥 Creator upload</h2>
        <div className="cu3-fields">
          <TargetFields brand={brand} camp={camp} onBrand={setBrand} onCamp={setCamp} />
        </div>
        <MessagePreview brand={brand} camp={camp} />
        <UploadBar onLoad={load} />
      </section>
      <UploadedCreators />
      <style>{`
        .cu3-ok { display: flex; gap: 14px; margin: -2px 0 18px; padding: 11px 15px; border-radius: 12px; background: #e6f7ef; border: 1px solid #bfe8d4; font-size: 12px; line-height: 1.45; color: #168560; }
        .cu3-ok b { font-weight: 700; margin-right: 2px; }
        .cu3-card { padding: 25px 22px 21px; }
        .cu3-fields { margin-top: 18px; }
        @media (max-width: 640px) { .cu3-card { padding: 18px 16px; } .cu3-ok { gap: 8px; } }
      `}</style>
    </AdminShell>
  );
}
