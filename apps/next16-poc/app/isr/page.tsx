import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function NestedLayoutsPage() {
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">ISR Next.js 16</h1>
        <div className="text-foreground/90">
          <p className="mb-4">
            Learn how to use ISR with Next.js 16. ISR is a technique that allows you to revalidate your pages at a specific interval.
          </p>
          <p>Time Revalidation in combination with Partial Prerendering allows you to achieve a very good performance.</p>
          <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
        </div>
      </div>
  )
}
