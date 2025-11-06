import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function GroupedLayoutsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Grouped Layouts</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Organize your routes with route groups without affecting the URL structure.</p>
        <p>
          Route groups allow you to organize your files and routes in a logical way while keeping your URL structure
          clean.
        </p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
