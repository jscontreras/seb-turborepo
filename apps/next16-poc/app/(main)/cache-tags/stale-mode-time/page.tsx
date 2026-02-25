import Link from "next/link"
import { Suspense } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { DocsCodeButtons } from "@/components/docs-code-buttons"
import { RevalidatePanel } from "./revalidate-panel"
import { Skeleton } from "@repo/ui/components/ui/skeleton"

const REVALIDATE_SECONDS = 30
const STALE_SECONDS = 15

const SLOTS = [
  { slot: "a", uniqueTag: "stale-demo-time-a" },
  { slot: "b", uniqueTag: "stale-demo-time-b" },
  { slot: "c", uniqueTag: "stale-demo-time-c" },
] as const

const SHARED_TAG = "stale-demo"

async function getCachedTime(
  slot: string,
  uniqueTag: string
): Promise<{ timestamp: number; slot: string; tags: string[] }> {
  const url = `https://api.tc-vercel.dev/api/cache-tags-demo/time?slot=${slot}`
  const res = await fetch(url, {
    cache: "force-cache",
    headers: {
      'X-Custom-TC-Api-Key': process.env.CUSTOM_API_KEY || '',
    },
    next: {
      tags: [uniqueTag, SHARED_TAG],
    },
  })
  const data = (await res.json()) as { timestamp: number; slot: string }
  return {
    ...data,
    tags: [uniqueTag, SHARED_TAG],
  }
}

const TAG_COLORS: Record<string, string> = {
  "stale-demo-time-a": "bg-sky-500/20 text-sky-300 border-sky-500/40",
  "stale-demo-time-b": "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "stale-demo-time-c": "bg-amber-500/20 text-amber-300 border-amber-500/40",
  "stale-demo": "bg-violet-500/20 text-violet-300 border-violet-500/40",
}

function TimeCard({
  data,
}: {
  data: { timestamp: number; slot: string; tags: string[] }
}) {
  const date = new Date(data.timestamp)
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  return (
    <div className="p-6 border rounded-lg border-border bg-card">
      <h3 className="mb-2 text-lg font-semibold text-card-foreground">
        Slot {data.slot.toUpperCase()}
      </h3>
      <p className="mb-2 font-mono text-2xl text-foreground">{timeStr}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Tags:</span>{" "}
        <span className="flex flex-wrap gap-1.5 mt-1">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground border-border"}`}
            >
              {tag}
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}

async function CacheTagsCards() {
  "use cache"
  // Stale mode: client can see cached data for STALE_SECONDS before checking; revalidate every REVALIDATE_SECONDS
  cacheLife({ stale: STALE_SECONDS, revalidate: REVALIDATE_SECONDS })
  cacheTag("stale-mode-cards")

  const results = await Promise.all(
    SLOTS.map(({ slot, uniqueTag }) => getCachedTime(slot, uniqueTag))
  )

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {results.map((data) => (
        <TimeCard key={data.slot} data={data} />
      ))}
    </div>
  )
}

function CardsFallback() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-6 border rounded-lg border-border bg-card"
        >
          <Skeleton className="w-20 h-5 mb-2" />
          <Skeleton className="w-24 h-8 mb-2" />
          <Skeleton className="w-48 h-4" />
        </div>
      ))}
    </div>
  )
}

export default function CacheTagsStaleModePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/cache-tags"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Cache Tags
      </Link>
      <h1 className="text-3xl font-bold text-foreground">
        Revalidate Tags (stale)
      </h1>
      <div className="text-foreground/90">
        <p className="mb-4">
          This page uses <strong>stale-while-revalidate</strong>: cache has a{" "}
          <strong>stale</strong> window ({STALE_SECONDS}s) and revalidates every{" "}
          {REVALIDATE_SECONDS}s. When you revalidate by tag, the server may serve
          stale content first, then refresh in the background—so you might see
          old timestamps briefly after refresh.
        </p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>

      <Suspense fallback={<CardsFallback />}>
        <CacheTagsCards />
      </Suspense>

      <RevalidatePanel />
    </div>
  )
}
