import { DocsCodeButtons } from "@/components/docs-code-buttons"

export default function ParallelRoutesPage() {
  return (
    <div className="p-8">
      {/* Route URL header */}
      <div className="mb-8 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">acme.com</span>
        <span className="text-sm text-foreground font-medium">/parallel-routes</span>
      </div>

      {/* Content area */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Parallel Routes</h1>
        </div>

        <div className="space-y-4 text-foreground/90">
          <ul className="space-y-3 list-disc list-inside">
            <li>
              Parallel Routes allow you to simultaneously or conditionally render multiple pages, with independent
              navigation, in the same layout.
            </li>
            <li>
              Parallel Routes can be used for advanced routing patterns like{" "}
              <span className="font-semibold">Conditional Routes</span> and{" "}
              <span className="font-semibold">Intercepted Routes</span>.
            </li>
            <li>
              Try using the tabs in one parallel route to navigate. Notice the URL changes but the unaffected parallel
              route is preserved.
            </li>
            <li>
              Try using the browser's backwards and forwards navigation. Notice the browser's URL history state and
              active UI state is correctly synced.
            </li>
            <li>
              Try navigating to a tab in one parallel route and refreshing the browser. Notice you can choose what UI to
              show parallel routes that don't match the initial URL.
            </li>
          </ul>

          <DocsCodeButtons docsUrl="/nested-layouts" codeUrl="/grouped-layouts" />
        </div>
      </div>
    </div>
  )
}
