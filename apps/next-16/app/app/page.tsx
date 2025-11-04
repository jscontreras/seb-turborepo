import Link from "next/link"
import { menuItems } from "@/lib/menu-items"

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold">Examples</h1>

        <div className="space-y-12">
          {Object.entries(menuItems).map(([section, items]) => (
            <div key={section}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{section}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Link
                    key={item.relativeUrl}
                    href={item.relativeUrl}
                    className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
                  >
                    <h3 className="mb-2 text-lg font-semibold text-card-foreground group-hover:text-primary">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
