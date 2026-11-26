"use client";
import { CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllRead() {
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" onClick={async () => { await fetch("/api/me/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }); router.refresh(); }}>
      <CheckCheck /> Mark all read
    </Button>
  );
}
