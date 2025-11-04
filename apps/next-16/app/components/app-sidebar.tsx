"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { menuItems } from "@/lib/menu-items"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 border-r border-border bg-sidebar transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo section */}
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-sm font-bold">N</span>
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">App Router</span>
            </div>
          </div>

          {/* Menu items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-6">
              {Object.entries(menuItems).map(([section, items]) => (
                <div key={section}>
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = pathname === item.relativeUrl
                      return (
                        <Link
                          key={item.relativeUrl}
                          href={item.relativeUrl}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                            isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground",
                          )}
                        >
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Version footer */}
          <div className="border-t border-sidebar-border px-6 py-4">
            <p className="text-xs text-muted-foreground">Next.js 16</p>
          </div>
        </div>
      </aside>
    </>
  )
}
