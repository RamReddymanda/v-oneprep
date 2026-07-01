"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function useRequireAdmin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ role: string }>("/auth/me")
      .then((user) => {
        if (!active) return;
        if (user.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (active) router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  return ready;
}
