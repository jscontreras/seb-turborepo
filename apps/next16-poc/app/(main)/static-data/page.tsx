import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function StaticDataPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Static Data</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Fetch and display static data at build time.</p>
        <p>Static data fetching allows you to generate pages at build time for optimal performance and SEO.</p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
