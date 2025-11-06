import { headers } from "next/headers"
import { UrlBreadcrumbWithPath } from "./url-breadcrumb-path"

// Server Component que usa headers() dentro de un Suspense boundary
// Con PPR habilitado, esto permite un shell estático con streaming del contenido dinámico
export async function UrlBreadcrumb() {
  const hostname = (await headers()).get('host') || ''
  return <UrlBreadcrumbWithPath hostName={hostname} />
}