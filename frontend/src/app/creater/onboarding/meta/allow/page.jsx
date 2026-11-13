"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /creater/onboarding/meta/allow — purana dummy permission step. Asli permissions ab Instagram (Meta) ki
 * apni window mein maangi jaati hain, isliye yahan aane wale ko seedha connect step par bhej do.
 */
export default function MetaAllow() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/creater/onboarding/meta" + window.location.search);
  }, [router]);
  return null;
}
