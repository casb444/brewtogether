"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";
import { BrandMark } from "@/components/BrandMark";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-6 text-center">
      <div>
        <BrandMark />
        <h1 className="font-display text-3xl text-ink mt-8 mb-3">The café hit a snag</h1>
        <p className="text-sm text-ink-soft mb-6 max-w-md">Something went wrong loading this page. Try again, or head back to the lobby.</p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" onClick={() => retry()}>
            Try again
          </Button>
          <Button href="/">Home</Button>
        </div>
      </div>
    </div>
  );
}
