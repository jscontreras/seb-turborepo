'use client'

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { UrlBreadcrumbWithPath } from "./url-breadcrumb-path"
import { Skeleton } from "@repo/ui/components/ui/skeleton"

export function UrlBreadcrumb() {
  // Obtener el hostname desde el cliente para que el layout sea cacheable
  // Usamos useState y useEffect para evitar problemas de hidratación
  const [hostname, setHostname] = useState('')
  const pathname = usePathname() // Disponible inmediatamente, no necesita skeleton

  useEffect(() => {
    setHostname(window.location.hostname)
  }, [])

  // Mostrar skeleton solo para el hostname mientras carga para evitar layout shift
  if (!hostname) {
    return (
      <div className="ml-8 md:ml-0 lg:ml-0 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <Skeleton className="h-4 w-20" />
        <span className="text-sm text-foreground font-medium">{pathname}</span>
      </div>
    )
  }

  return <UrlBreadcrumbWithPath hostName={hostname} />
}