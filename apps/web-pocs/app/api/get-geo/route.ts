import { NextResponse } from "next/server"

export async function GET() {
  // This is a fallback API route in case the middleware doesn't intercept
  return NextResponse.json({
    country: "USA",
    city: "Dallas",
  })
}

