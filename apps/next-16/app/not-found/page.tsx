export default function NotFoundPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/not-found</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Not Found</h1>
        <div className="text-foreground/90">
          <p className="mb-4">Create custom 404 pages for better user experience.</p>
          <p>
            Not Found pages help users understand when they've navigated to a route that doesn't exist and provide
            helpful navigation options.
          </p>
        </div>
      </div>
    </div>
  )
}
