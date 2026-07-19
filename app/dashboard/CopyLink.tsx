"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="card-flat flex-1 truncate bg-cream px-3.5 py-2 text-sm">
        {url}
      </code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="btn btn-primary shrink-0 px-4 py-2 text-sm"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
