import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // This ensures the route is always dynamic and never cached

export async function GET(req: NextRequest) {
  // Simulate fetching some data
  const middlewareHeader = req.headers.get('X-Custom-Header')|| 'none';
  const data = {
    message: "This is dynamic data",
    datetime: new Date().toISOString(),
    middlewareHeader: `X-Custom-Header: ${middlewareHeader}`
  };

  // Return the response
  return NextResponse.json(data);
}
