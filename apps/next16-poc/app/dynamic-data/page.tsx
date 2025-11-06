import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function DynamicDataPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dynamic Data</h1>
      <div className="text-foreground/90">
        <p className="mb-4">Work with dynamic data fetching at request time.</p>
        <p>
          Dynamic data fetching allows you to fetch fresh data on every request, perfect for personalized or
          frequently changing content.
        </p>
        <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
      </div>
    </div>
  )
}
