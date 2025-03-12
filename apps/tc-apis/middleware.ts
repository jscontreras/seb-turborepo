import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // How to override cache headers (This will break cache as it is private)
  if (url.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
      response.headers.set(
        'X-Custom-Header',
        'Header-Added-Via-Middleware',
      );
    return response;
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
