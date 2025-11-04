import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function StreamingPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/streaming</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Streaming with Suspense</h1>
        <div className="text-foreground/90">
          <p className="mb-4">Stream content progressively with React Suspense.</p>
          <p>
            Streaming allows you to break down the page's HTML into smaller chunks and progressively send those chunks
            to the client.
          </p>
          <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
        </div>
      </div>
    </div>
  )
}
