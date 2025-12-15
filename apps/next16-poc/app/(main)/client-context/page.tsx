import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function ClientContextPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Client Context</h1>

      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground">
          Pass context between Client Components to share state and functionality across your component tree.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Key Features</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>Use React Context to share data between components</li>
            <li>Avoid prop drilling in complex component hierarchies</li>
            <li>Create custom hooks for cleaner context consumption</li>
            <li>Combine with client state management solutions</li>
          </ul>
        </div>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
