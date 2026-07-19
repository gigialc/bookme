"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 truncate rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">
        {url}
      </code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-xl bg-rose-400 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500"
      >
        {copied ? "Copied! 🎀" : "Copy"}
      </button>
    </div>
  );
}
