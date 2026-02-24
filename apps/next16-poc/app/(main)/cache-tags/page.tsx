import Link from "next/link"
import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function CacheTagsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Cache Tags</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Check Cache Tags with Next.js 16</p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/cache-tags/stale-mode"
          className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
        >
          <h2 className="mb-2 text-lg font-semibold text-card-foreground group-hover:text-primary">
            Revalidate Tags (STALE)
          </h2>
          <p className="text-sm text-muted-foreground">
            Content revalidated when the tag was stale.
          </p>
        </Link>
        <Link
          href="/cache-tags/miss-mode"
          className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
        >
          <h2 className="mb-2 text-lg font-semibold text-card-foreground group-hover:text-primary">
            Revalidate Tags (MISS)
          </h2>
          <p className="text-sm text-muted-foreground">
            Content revalidated after a cache miss.
          </p>
        </Link>
      </div>
    </div>
  )
}
