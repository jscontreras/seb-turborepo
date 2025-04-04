import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { middlewareTraceEnabler } from "@repo/otel-config/next-utils";

async function originalMiddleware(request: NextRequest) {
  const url = request.nextUrl;

  // How to override cache headers (This will break cache as it is private)
  if (url.pathname === "/" || url.pathname.startsWith("/api")) {
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
  const pathname = request.nextUrl.pathname;
  const extensionPattern = /\.[^\/]+$/;

  if (extensionPattern.test(pathname)) {
    return NextResponse.next();
  }
  return middlewareTraceEnabler(
    `Middleware: ${request.nextUrl.pathname}`,
    async () => {
      return (await originalMiddleware(request)) || NextResponse.next();
    },
    {
      sendLogs: true,
      extraAttributes: {
        middleware: "Hello World (api.tc-vercel.dev!!",
        spanText: "Some Span Text",
      },
      forceRename: true,
    },
  );
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/api/:path*",
  ],
};
