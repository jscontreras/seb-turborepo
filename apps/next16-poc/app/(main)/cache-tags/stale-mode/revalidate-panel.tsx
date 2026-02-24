"use client"

import { useEffect, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Label } from "@repo/ui/components/ui/label"

function RevalidateCountdown({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds)

  useEffect(() => {
    setLeft(seconds)
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          const url = new URL(window.location.href)
          url.searchParams.set("_", Date.now().toString())
          window.location.replace(url.toString())
          return seconds
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [seconds])

  const handleRefresh = () => {
    const url = new URL(window.location.href)
    url.searchParams.set("_", Date.now().toString())
    window.location.replace(url.toString())
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 transition-colors hover:bg-muted hover:border-primary/50"
      title="Refresh now"
    >
      <span className="text-sm text-muted-foreground">Auto-refresh in</span>
      <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
        {left}s
      </span>
    </button>
  )
}

const DEMO_TAGS = [
  {
    id: "stale-demo-time-a",
    label: "stale-demo-time-a (slot A)",
    className: "text-sky-400",
  },
  {
    id: "stale-demo-time-b",
    label: "stale-demo-time-b (slot B)",
    className: "text-emerald-400",
  },
  {
    id: "stale-demo-time-c",
    label: "stale-demo-time-c (slot C)",
    className: "text-amber-400",
  },
  {
    id: "stale-demo",
    label: "stale-demo (shared)",
    className: "text-violet-400",
  },
  {
    id: "stale-mode-cards",
    label: "stale-mode-cards (page cache)",
    className: "text-rose-400",
  },
] as const

export const REVALIDATE_SECONDS = 30

export function RevalidatePanel() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setMessage(null)
  }

  const handleSubmit = async () => {
    if (selected.size === 0) {
      setMessage("Select at least one tag.")
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/cache-tags-demo/revalidate-stale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? "Revalidation failed")
        setLoading(false)
        return
      }
      setMessage(`Revalidated: ${data.revalidated.join(", ")}. Hard refreshing…`)
      const url = new URL(window.location.href)
      url.searchParams.set("_", Date.now().toString())
      window.location.replace(url.toString())
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed")
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-card-foreground">
          Revalidate by tag (stale-while-revalidate)
        </h3>
        <RevalidateCountdown seconds={REVALIDATE_SECONDS} />
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Revalidation uses <strong>stale-while-revalidate</strong>: you may see
        old timestamps first, then fresh data. Select tags and submit to trigger
        revalidation, then hard refresh.
      </p>
      <div className="mb-4 flex flex-wrap gap-4">
        {DEMO_TAGS.map(({ id, label, className }) => (
          <div
            key={id}
            className="flex items-center space-x-2"
          >
            <Checkbox
              id={id}
              checked={selected.has(id)}
              onCheckedChange={() => toggle(id)}
            />
            <Label
              htmlFor={id}
              className={`cursor-pointer font-mono text-sm font-medium leading-none ${className}`}
            >
              {label}
            </Label>
          </div>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading || selected.size === 0}
        variant="secondary"
      >
        {loading ? "Revalidating…" : "Revalidate & hard refresh"}
      </Button>
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
