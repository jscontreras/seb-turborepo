"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Label } from "@repo/ui/components/ui/label"

const DEMO_TAGS = [
  {
    id: "miss-demo-time-a",
    label: "miss-demo-time-a (slot A)",
    className: "text-sky-400",
  },
  {
    id: "miss-demo-time-b",
    label: "miss-demo-time-b (slot B)",
    className: "text-emerald-400",
  },
  {
    id: "miss-demo-time-c",
    label: "miss-demo-time-c (slot C)",
    className: "text-amber-400",
  },
  {
    id: "miss-demo",
    label: "miss-demo (shared)",
    className: "text-violet-400",
  },
  {
    id: "miss-mode-cards",
    label: "miss-mode-cards (page cache)",
    className: "text-rose-400",
  },
] as const

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
      const res = await fetch("/api/cache-tags-demo/revalidate", {
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
      setMessage(`Revalidated: ${data.revalidated.join(", ")}.`)
      setLoading(false)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed")
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">
        Revalidate by tag
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Select one or more tags, then submit to revalidate. Refreshing the page
        will show new timestamps for invalidated fetches.
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
        {loading ? "Revalidating…" : "Revalidate Tag"}
      </Button>
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
