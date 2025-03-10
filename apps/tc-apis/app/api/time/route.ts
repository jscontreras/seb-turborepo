import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // This ensures the route is always dynamic and never cached

export async function GET() {
  // Simulate fetching some data
  const data = {
    message: "This is dynamic data",
    datetime: new Date().toISOString(),
  };

  // Return the response
  return NextResponse.json(data);
}
