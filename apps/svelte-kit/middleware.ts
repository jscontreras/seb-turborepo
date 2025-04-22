import { next } from "@vercel/edge";

// config with custom matcher
export const config = {
  matcher: "/",
};

export default function middleware(request: Request) {
  const geo = {
    country: request.headers.get("x-vercel-ip-country") || null,
    city: request.headers.get("x-vercel-ip-city") || null,
    zipcode: request.headers.get("x-vercel-ip-postal-code") || null,
  };
  console.log(">>>>>MIDDLEWARE VERCEL", geo);
  return next();
}
