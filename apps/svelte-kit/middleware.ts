// config with custom matcher - include redirect routes
export const config = {
  matcher: ["/", "/redirect/:path*"],
  runtime: 'nodejs',
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);

  // Handle /redirect/[something] -> /redirected/[something]
  if (pathSegments[0] === 'redirect' && pathSegments[1]) {
    const something = pathSegments[1];
    console.log(`🔄 Middleware redirect: /redirect/${something} -> /redirected/${something}`);

    // Create the redirect URL
    const redirectUrl = new URL(url);
    redirectUrl.pathname = `/redirected/${something}`;

    return Response.redirect(redirectUrl.toString(), 302);
  }

  const geo = {
    country: request.headers.get("x-vercel-ip-country") || null,
    city: request.headers.get("x-vercel-ip-city") || null,
    zipcode: request.headers.get("x-vercel-ip-postal-code") || null,
  };
  console.log(">>>>>MIDDLEWARE VERCEL", geo);
}
