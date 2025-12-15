import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function ErrorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Error Handling</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Handle errors gracefully with error boundaries in Next.js.</p>
        <p>
          Error boundaries catch JavaScript errors anywhere in the component tree and display a fallback UI instead of
          crashing the entire app.
        </p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
