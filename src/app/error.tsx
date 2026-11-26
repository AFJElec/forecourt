"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); /* Phase 8: report to Sentry */ }, [error]);
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-muted">Please try again. If the problem continues, contact support{error.digest ? ` (ref ${error.digest})` : ""}.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
