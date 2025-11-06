import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function NotFoundPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Not Found</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Create custom 404 pages for better user experience.</p>
        <p>
          Not Found pages help users understand when they've navigated to a route that doesn't exist and provide
          helpful navigation options.
        </p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
