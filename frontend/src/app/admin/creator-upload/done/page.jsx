"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { PageHead } from "@/components/admin/ui";
import { TargetFields, MessagePreview, UploadBar, UploadedCreators, cuLoad, cuSave } from "@/components/admin/creator/UploadParts";

/* Creator upload — step 3: creators add ho gaye, form khaali, naye upload ke liye taiyaar (Figma 073) */
export default function CreatorUploadDone() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [camp, setCamp] = useState("");
  const [res, setRes] = useState(null);

  // creator_upload_v2 ka jawab (step 2 se)
  useEffect(() => {
    const s = cuLoad();
    if (s && s.result) setRes(s.result);
  }, []);

  const load = (sheet) => {
    cuSave({ brand, camp, sheet, send: true });
    router.push("/admin/creator-upload/match");
  };
  const d = res || {};
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  return (
    <AdminShell>
      <PageHead title="Creator upload" sub="Add creators who aren’t on Geek OS yet and invite them to the live campaigns." />
      {res && (
        <p className="cu3-ok">
          <span>✓</span>
          <span>
            <b>{plural(d.added || 0, "new creator")} added</b>
            {d.invited ? `· ${d.invited} invited to explore campaigns` : ""}
            {d.updated ? ` · ${d.updated} already uploaded (details updated)` : ""}
            {d.already_on_geek ? ` · ${d.already_on_geek} already on Geek OS` : ""}
            {d.skipped ? ` · ${d.skipped} skipped` : ""}
          </span>
        </p>
      )}
      <section className="ga-card cu3-card">
        <h2 className="ga-h2">📥 Creator upload</h2>
        <div className="cu3-fields">
          <TargetFields brand={brand} camp={camp} onBrand={setBrand} onCamp={setCamp} />
        </div>
        <MessagePreview brand={brand} camp={camp} />
        <UploadBar onLoad={load} />
      </section>
      <UploadedCreators brand={brand} />
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
