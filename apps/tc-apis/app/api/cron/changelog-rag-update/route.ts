import type { NextRequest } from "next/server";
import { updateVercelChangelog } from "@repo/ai-sdk/changelog";
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isDevelopment = process.env.NODE_ENV === "development";
  if (!isDevelopment && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  const result = await updateVercelChangelog();
  return Response.json({ success: true, result });
}
