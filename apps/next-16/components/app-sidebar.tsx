"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { menuItems } from "@/lib/menu-items"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@repo/ui/components/ui/button"

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
            <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded">
              <svg className="h-8 w-8" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask
                  id="mask0_408_139"
                  style={{ maskType: "alpha" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="180"
                  height="180"
                >
                  <circle cx="90" cy="90" r="90" fill="black" />
                </mask>
                <g mask="url(#mask0_408_139)">
                  <circle cx="90" cy="90" r="90" fill="black" />
                  <path
                    d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z"
                    fill="url(#paint0_linear_408_139)"
                  />
                  <rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear_408_139)" />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_408_139"
                    x1="109"
                    y1="116.5"
                    x2="144.5"
                    y2="160.5"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_408_139"
                    x1="121"
                    y1="54"
                    x2="120.799"
                    y2="106.875"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-lg font-semibold text-sidebar-foreground">App Router</span>
            </Link>
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
