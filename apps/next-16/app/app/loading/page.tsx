export default function LoadingPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/loading</span>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Loading UI</h1>
        <div className="text-foreground/90">
          <p className="mb-4">Create instant loading states with Suspense boundaries in Next.js.</p>
          <p>
            Loading UI helps provide feedback to users while content is being fetched or components are being rendered.
          </p>
        </div>
      </div>
    </div>
  )
}
