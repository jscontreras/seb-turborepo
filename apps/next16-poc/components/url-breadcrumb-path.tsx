'use client'
import { usePathname } from "next/navigation"
export function UrlBreadcrumbWithPath({ hostName }: { hostName: string }) {
  const pathname = usePathname();
  return (
    <div className="ml-8 md:ml-0 lg:ml-0 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{hostName}</span>
      <span className="text-sm text-foreground font-medium">{pathname}</span>
    </div>
  )
}