"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/overview");
  }, [router]);

  return null; // nothing to render, just redirect
}
