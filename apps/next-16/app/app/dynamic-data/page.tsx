export default function DynamicDataPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/dynamic-data</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dynamic Data</h1>
        <div className="text-foreground/90">
          <p className="mb-4">Work with dynamic data fetching at request time.</p>
          <p>
            Dynamic data fetching allows you to fetch fresh data on every request, perfect for personalized or
            frequently changing content.
          </p>
        </div>
      </div>
    </div>
  )
}
