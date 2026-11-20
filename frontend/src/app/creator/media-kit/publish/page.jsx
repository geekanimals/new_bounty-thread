"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Purana link — Post to Instagram ab sidebar ka apna page hai (/creator/instagram) */
export default function OldPublish() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/creator/instagram${window.location.search || ""}`);
  }, [router]);
  return null;
}
