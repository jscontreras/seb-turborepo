import { headers } from "next/headers"
import { UrlBreadcrumbWithPath } from "./url-breadcrumb-path"
import { cacheLife } from "next/cache"

// Server Component que usa headers() dentro de un Suspense boundary
// Con PPR habilitado, esto permite un shell estático con streaming del contenido dinámico
//
// 'use cache: private' - Cache privado para contenido que depende de datos específicos de la solicitud
//
// DIFERENCIAS CLAVE:
// - 'use cache' (normal): Cachea en el servidor, reutilizable entre todas las solicitudes
// - 'use cache: private': NO cachea en el servidor, solo permite prefetching en el cliente
//
// POR QUÉ USAR 'use cache: private' AQUÍ:
// Este componente depende de headers() que varía por solicitud (hostname diferente por dominio).
// No puede usar 'use cache' normal porque cada solicitud tiene headers únicos.
// 'use cache: private' permite:
//   1. Prefetching en el cliente para mejorar el rendimiento
//   2. NO almacenar en caché del servidor (evita servir hostname incorrecto a otros usuarios)
//   3. Renderizado dinámico correcto para cada solicitud específica
//
// COMPORTAMIENTO:
// - El componente se renderiza en cada solicitud con los headers correctos
// - Next.js puede prefetchear el componente en el cliente para navegación anticipada
// - NO genera headers de caché del servidor (x-nextjs-cache no aparecerá para este RSC)
// - El cacheLife({ stale: Infinity }) controla el tiempo de prefetch en el cliente
export async function UrlBreadcrumb() {
  'use cache: private'

  // Configura el tiempo de vida de la caché (opcional)
  // stale: tiempo en segundos antes de que la caché se considere obsoleta
  cacheLife({ stale: Infinity })

  const hostname = (await headers()).get('host') || ''
  return <UrlBreadcrumbWithPath hostName={hostname} />
}