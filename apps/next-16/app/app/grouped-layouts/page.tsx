export default function GroupedLayoutsPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/grouped-layouts</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Grouped Layouts</h1>
        <div className="text-foreground/90">
          <p className="mb-4">Organize your routes with route groups without affecting the URL structure.</p>
          <p>
            Route groups allow you to organize your files and routes in a logical way while keeping your URL structure
            clean.
          </p>
        </div>
      </div>
    </div>
  )
}
