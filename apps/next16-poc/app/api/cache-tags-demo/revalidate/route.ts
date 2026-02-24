import { NextRequest } from "next/server"
import { revalidateTag } from "next/cache"

const ALLOWED_TAGS = [
  "miss-demo-time-a",
  "miss-demo-time-b",
  "miss-demo-time-c",
  "miss-demo",
  "miss-mode-cards", // ISR page cache; revalidate so next load shows fresh cards
] as const

export async function POST(request: NextRequest) {
  let body: { tags?: string[] }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Invalid JSON body", revalidated: [] },
      { status: 400 }
    )
  }

  const requested = Array.isArray(body.tags) ? body.tags : []
  const toRevalidate = requested.filter((tag) =>
    ALLOWED_TAGS.includes(tag as (typeof ALLOWED_TAGS)[number])
  )

  // When revalidating any data tag, also revalidate the page cache so the
  // next load re-runs the cached component and shows fresh timestamps
  const dataTags = [
    "miss-demo-time-a",
    "miss-demo-time-b",
    "miss-demo-time-c",
    "miss-demo",
  ]
  const revalidatingData = toRevalidate.some((t) => dataTags.includes(t))
  const tagsToRevalidate =
    revalidatingData && !toRevalidate.includes("miss-mode-cards")
      ? [...toRevalidate, "miss-mode-cards"]
      : toRevalidate

  // Use { expire: 0 } so the next request is a cache MISS and gets fresh data.
  // "max" would use stale-while-revalidate (serve stale, then revalidate in background).
  for (const tag of tagsToRevalidate) {
    revalidateTag(tag, { expire: 0 })
  }

  return Response.json({ revalidated: tagsToRevalidate })
}
