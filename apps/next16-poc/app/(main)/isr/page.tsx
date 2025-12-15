import { DocsCodeButtons } from "@/components/docs-code-buttons"
import { UrlBreadcrumb } from "@/components/url-breadcrumb"
import { Skeleton } from "@repo/ui/components/ui/skeleton"
import { Suspense } from "react"

export default function NestedLayoutsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">ISR Next.js 16</h1>
      {/* Suspense boundary para PPR: shell estático con streaming del contenido dinámico */}
      <Suspense
        fallback={
          <div className="ml-8 md:ml-0 lg:ml-0 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        }
      >
        <UrlBreadcrumb />
      </Suspense>
      <div className="text-foreground/90">
        <p className="mb-4">
          Learn how to use ISR with Next.js 16. ISR is a technique that allows you to revalidate your pages at a specific interval.
        </p>
        <p>Time Revalidation in combination with Partial Prerendering allows you to achieve a very good performance.</p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
