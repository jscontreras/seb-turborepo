import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function StaticDataPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/static-data</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Static Data</h1>
        <div className="text-foreground/90">
          <p className="mb-4">Fetch and display static data at build time.</p>
          <p>Static data fetching allows you to generate pages at build time for optimal performance and SEO.</p>
          <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
        </div>
      </div>
    </div>
  )
}
