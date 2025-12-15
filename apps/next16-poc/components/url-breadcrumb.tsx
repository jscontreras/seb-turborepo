import { headers } from "next/headers"
import { UrlBreadcrumbWithPath } from "./url-breadcrumb-path"
import { cacheLife, cacheTag } from "next/cache"

// Server Component that uses headers() inside a Suspense boundary
// With PPR enabled, this allows a static shell with streaming of dynamic content
//
// 'use cache: private' - Private cache for content that depends on request-specific data
//
// KEY DIFFERENCES:
// - 'use cache' (normal): Caches on the server, reusable across all requests
// - 'use cache: private': Does NOT cache on the server, only allows client prefetching
//
// WHY USE 'use cache: private' HERE:
// This component depends on headers() which vary per request (hostname differs by domain).
// It cannot use normal 'use cache' because each request has unique headers.
// 'use cache: private' allows:
//   1. Client prefetching to improve performance
//   2. NO server-side caching (prevents serving incorrect hostname to other users)
//   3. Proper dynamic rendering for each specific request
//
// BEHAVIOR:
// - The component renders on every request with the correct headers
// - Next.js can prefetch the component on the client for faster navigation
// - Does NOT generate server cache headers (x-nextjs-cache will not appear for this RSC)
// - cacheLife({ stale: Infinity }) controls client prefetch lifetime
export async function UrlBreadcrumb() {
  'use cache: private'

  // adding latency for easier debugging
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Configure cache lifetime (optional)
  // stale: time in seconds before the client checks the server again
  // With cache:private, the server always renders fresh (no server cache)
  // The stale parameter controls client-side prefetch cache expiration
  // After 30 seconds, client-side navigation will fetch fresh data from server
  cacheLife({ stale: 30, revalidate: 60, expire: 3600 })
  cacheTag('url-breadcrumb')
  const hostname = 'cache:private[' + Date.now() + '] ' + (await headers()).get('host') || ''

  return <UrlBreadcrumbWithPath hostName={hostname} />
}