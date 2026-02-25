import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const slot = request.nextUrl.searchParams.get("slot") ?? "default"
  return Response.json({
    timestamp: Date.now(),
    slot,
  })
}
