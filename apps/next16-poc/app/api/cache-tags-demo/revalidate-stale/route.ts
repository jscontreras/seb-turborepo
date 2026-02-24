import { NextRequest } from "next/server"
import { revalidateTag } from "next/cache"

const ALLOWED_TAGS = [
  "stale-demo-time-a",
  "stale-demo-time-b",
  "stale-demo-time-c",
  "stale-demo",
  "stale-mode-cards",
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

  const dataTags = [
    "stale-demo-time-a",
    "stale-demo-time-b",
    "stale-demo-time-c",
    "stale-demo",
  ]
  const revalidatingData = toRevalidate.some((t) => dataTags.includes(t))
  const tagsToRevalidate =
    revalidatingData && !toRevalidate.includes("stale-mode-cards")
      ? [...toRevalidate, "stale-mode-cards"]
      : toRevalidate

  // Use "max" for stale-while-revalidate: serve stale content first, then revalidate in background
  for (const tag of tagsToRevalidate) {
    revalidateTag(tag, "max")
  }

  return Response.json({ revalidated: tagsToRevalidate })
}
