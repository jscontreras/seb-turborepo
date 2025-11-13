'use client'
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function UrlBreadcrumbWithPath({ hostName }: { hostName: string }) {
  const pathname = usePathname();

  // Split pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean)

  // Build cumulative paths for each segment
  const breadcrumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/")
    return {
      label: segment,
      path,
    }
  })

  return (
    <div className="ml-8 md:ml-0 lg:ml-0 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
      {/* Hostname link */}
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {hostName}
      </Link>

      {/* Path segments */}
      {breadcrumbs.map((breadcrumb) => (
        <div key={breadcrumb.path} className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <Link
            href={breadcrumb.path}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {breadcrumb.label}
          </Link>
        </div>
      ))}
    </div>
  )
}