"use client";

import { useState } from "react";
import { Code2, Copy, Check, Smartphone, Terminal } from "lucide-react";
import { Panel } from "@/components/console/light-ui";
import { cx } from "@/components/ui/primitives";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-2xl bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/10 text-zinc-300 transition hover:bg-white/20"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

const CURL_LIST = `curl https://your-domain.example/api/public/v1/packs`;

const CURL_RECOMMEND = `curl -X POST https://your-domain.example/api/public/v1/packs/real-estate/recommend \\
  -H "Content-Type: application/json" \\
  -d '{
    "answers": {
      "household": "family",
      "budget": { "min": 200000, "max": 400000 },
      "bedrooms": 4
    }
  }'`;

const JS_EXAMPLE = `const res = await fetch(
  "https://your-domain.example/api/public/v1/packs/real-estate/recommend",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answers: { household: "family", budget: { min: 200000, max: 400000 } },
    }),
  },
);
const { recommendations } = await res.json();
console.log(recommendations[0].narrative);`;

/**
 * Public API & SDK (Module 12 · Future Platform). The endpoints below are
 * real — the same Decision Engine the companion calls — so every example
 * here actually runs. No API key is required in this pilot: a stateless
 * serverless function can't check a key against a tenant it has no
 * database row for, so real per-tenant auth is listed as a "what a
 * production deployment adds" item rather than faked with a cosmetic key
 * field. Only shipped packs are servable — a tenant's custom packs live in
 * browser localStorage the server can't reach.
 */
export function DeveloperPlatform() {
  return (
    <div className="space-y-4">
      <Panel title="Public API">
        <p className="mb-4 text-sm text-zinc-500">
          Two real, working endpoints — the same scoring engine the companion
          uses. Try them from this same deployment right now.
        </p>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Terminal className="h-3.5 w-3.5" /> List shipped packs
            </div>
            <CodeBlock code={CURL_LIST} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Terminal className="h-3.5 w-3.5" /> Get recommendations
            </div>
            <CodeBlock code={CURL_RECOMMEND} />
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
          No API key required in this pilot. A production deployment would
          add per-tenant keys, rate limiting, and custom-pack access — this
          is a real limitation of a stateless demo backend, disclosed rather
          than faked with a cosmetic key field.
        </div>
      </Panel>

      <Panel title="SDK example (JavaScript)">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Code2 className="h-3.5 w-3.5" /> No package to install — it&rsquo;s two fetch calls
        </div>
        <CodeBlock code={JS_EXAMPLE} />
      </Panel>

      <Panel title="Mobile app">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-zinc-700">
              The Sales Companion is a real installable app — no app store
              needed. On a phone, open <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">/companion</code>{" "}
              and use &ldquo;Add to Home Screen&rdquo; (Safari) or the install
              prompt (Chrome/Android) for a full-screen, standalone launch.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
