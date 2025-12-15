import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "@/app/globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { UrlBreadcrumb } from "@/components/url-breadcrumb"
import { Suspense } from "react"
import { Skeleton } from "@repo/ui/components/ui/skeleton"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Next.js App Router",
  description: "A Next.js 16 app with dynamic sidebar routing",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <AppSidebar />
        <div className="md:pl-72">
          <main className="min-h-screen">
            <div className="min-h-screen p-8">
              {/* Suspense boundary para PPR: shell estático con streaming del contenido dinámico */}
              <Suspense
                fallback={
                  <div className="ml-8 md:ml-0 lg:ml-0 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                }
              >
                <UrlBreadcrumb />
              </Suspense>
              <div className="min-h-screen p-8">
              {children}
              </div>
            </div>
          </main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
