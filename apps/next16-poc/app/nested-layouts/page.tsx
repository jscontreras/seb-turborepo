import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function NestedLayoutsPage() {
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Nested Layouts</h1>
        <div className="text-foreground/90">
          <p className="mb-4">
            Learn how to create nested layouts in Next.js to share UI between routes while preserving state and avoiding
            expensive re-renders.
          </p>
          <p>Layouts wrap around page components and can be nested to create sophisticated routing structures.</p>
          <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
        </div>
      </div>
  )
}
