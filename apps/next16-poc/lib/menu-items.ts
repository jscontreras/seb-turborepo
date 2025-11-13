export interface MenuItem {
  name: string
  description: string
  relativeUrl: string
}

export const menuItems: Record<string, MenuItem[]> = {
  LAYOUTS: [
    {
      name: "ISR",
      description: "Checking ISR with Next.js 16",
      relativeUrl: "/isr",
    },
    {
      name: "Grouped Layouts",
      description: "Organize routes without affecting URL paths",
      relativeUrl: "/grouped-layouts",
    },
    {
      name: "Parallel Routes",
      description: "Render multiple pages in the same layout",
      relativeUrl: "/parallel-routes",
    },
  ],
  "FILE CONVENTIONS": [
    {
      name: "Loading",
      description: "Create meaningful Loading UI for specific parts of an app",
      relativeUrl: "/loading",
    },
    {
      name: "Error",
      description: "Create Error UI for specific parts of an app",
      relativeUrl: "/error",
    },
    {
      name: "Not Found",
      description: "Create Not Found UI for specific parts of an app",
      relativeUrl: "/not-found",
    },
  ],
  "DATA FETCHING": [
    {
      name: "Streaming with Suspense",
      description: "Streaming data fetching from the server with React Suspense",
      relativeUrl: "/streaming",
    },
    {
      name: "Static Data",
      description: "Generate static pages",
      relativeUrl: "/static-data",
    },
    {
      name: "Dynamic Data",
      description: "Server-side render pages with dynamic data",
      relativeUrl: "/dynamic-data",
    },
  ],
  COMPONENTS: [
    {
      name: "Client Context",
      description: "Pass context between Client Components",
      relativeUrl: "/client-context",
    },
  ],
}

// Helper function to get all menu items as a flat array
export function getAllMenuItems(): MenuItem[] {
  return Object.values(menuItems).flat()
}
