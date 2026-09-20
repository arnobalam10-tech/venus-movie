"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TvConnected({ pairedAt }: { pairedAt: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleUnpair() {
    setPending(true);
    try {
      await fetch("/api/tv/unpair", { method: "POST" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
        Connected since {new Date(pairedAt).toLocaleDateString()}
      </p>
      <p className="text-sm text-muted">
        Look for the cast icon in the player while browsing to send something to your TV.
      </p>
      <button
        type="button"
        onClick={handleUnpair}
        disabled={pending}
        className="text-sm text-muted underline transition-colors hover:text-foreground disabled:opacity-50"
      >
        {pending ? "Disconnecting..." : "Forget this TV"}
      </button>
    </div>
  );
}
