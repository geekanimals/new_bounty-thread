"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/* /vault/creators/[id] — seedha Profile tab par bhejta hai */
export default function CreatorIndex() {
  const { id } = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/vault/creators/${id}/profile`);
  }, [id, router]);
  return null;
}
