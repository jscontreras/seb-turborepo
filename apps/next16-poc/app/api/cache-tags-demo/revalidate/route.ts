import { NextRequest } from "next/server"
import { revalidateTag } from "next/cache"

const METHODS = ["revalidateTag", "updateTag"] as const
type Method = (typeof METHODS)[number]

export async function POST(request: NextRequest) {
  let body: { tags?: unknown; method?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Invalid JSON body", revalidated: [] },
      { status: 400 }
    )
  }

  const requested = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : []

  const method = METHODS.includes(body.method as Method)
    ? (body.method as Method)
    : "revalidateTag"

  if (method === "updateTag") {
    return Response.json(
      {
        error:
          "updateTag can only be called from a Server Action. Use the revalidate panel with method set to updateTag.",
        revalidated: [],
      },
      { status: 400 }
    )
  }

  for (const tag of requested) {
    revalidateTag(tag, { expire: 0 })
  }

  return Response.json({ revalidated: requested })
}
