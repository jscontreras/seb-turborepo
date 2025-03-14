import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { traceEnabler } from "@repo/otel-config/next-utils";

async function originalMiddleware(request: NextRequest) {
  const url = request.nextUrl;

  // How to override cache headers (This will break cache as it is private)
  if (url.pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("X-Custom-Header", "Header-Added-Via-Middleware");
    return response;
  }
}

/**
 * Middleware implementation with span implementation
 * https://github.com/vercel/otel/blob/main/apps/sample/middleware.ts
 * @param request
 * @param event
 * @returns
 */
export async function middleware(request: NextRequest): Promise<Response> {
  return traceEnabler(
    `Middleware: ${request.nextUrl.pathname}`,
    async () => {
      return (await originalMiddleware(request)) || NextResponse.next();
    },
    true,
    {
      middleware: "Hello World (api.tc-vercel.dev!!",
      spanText: "Some Span Text"
    },
  );
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/api/:path*"],
};
