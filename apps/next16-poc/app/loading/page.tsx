import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function LoadingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Loading UI</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Create instant loading states with Suspense boundaries in Next.js.</p>
        <p>
          Loading UI helps provide feedback to users while content is being fetched or components are being rendered.
        </p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
