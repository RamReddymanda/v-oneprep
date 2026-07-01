"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminCourse } from "@/lib/admin-courses-types";

export function useAdminCourses(ready: boolean) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reload() {
    try {
      setCourses(await api<AdminCourse[]>("/admin/courses"));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready) void reload();
  }, [ready]);

  return { courses, loading, error, reload };
}
