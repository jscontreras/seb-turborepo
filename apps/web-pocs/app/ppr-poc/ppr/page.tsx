import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Skeleton } from "@repo/ui/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@repo/ui/components/ui/button"
import { headers } from "next/headers"

// This enables PPR for this route
export const experimental_ppr = true

async function FastComponent() {
  const headersList = headers()
  const delay = 2000
  const title = "Fast Content (2s delay)"
  console.log(`[v0] ${title} starting with ${delay}ms delay at ${new Date().toLocaleTimeString()}`)

  await new Promise((resolve) => setTimeout(resolve, delay))

  console.log(`[v0] ${title} finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after {delay}ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

async function MediumComponent() {
  const headersList = headers()
  const delay = 4000
  const title = "Medium Content (4s delay)"
  console.log(`[v0] ${title} starting with ${delay}ms delay at ${new Date().toLocaleTimeString()}`)

  await new Promise((resolve) => setTimeout(resolve, delay))

  console.log(`[v0] ${title} finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after {delay}ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

async function SlowComponent() {
  const headersList = headers()
  const delay = 6000
  const title = "Slow Content (6s delay)"
  console.log(`[v0] ${title} starting with ${delay}ms delay at ${new Date().toLocaleTimeString()}`)

  await new Promise((resolve) => setTimeout(resolve, delay))

  console.log(`[v0] ${title} finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after {delay}ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

async function VerySlowComponent() {
  const headersList = headers()
  const delay = 8000
  const title = "Very Slow Content (8s delay)"
  console.log(`[v0] ${title} starting with ${delay}ms delay at ${new Date().toLocaleTimeString()}`)

  await new Promise((resolve) => setTimeout(resolve, delay))

  console.log(`[v0] ${title} finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-purple-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after {delay}ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

function LoadingCard({ title, delay }: { title: string; delay: string }) {
  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
      <CardHeader>
        <CardTitle className="text-gray-500 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-3/4 animate-pulse" />
          <div className="flex items-center gap-2 mt-3">
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <span className="text-xs text-gray-500 ml-2">Loading {delay}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PPRPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/ppr-poc">← Back to Home</Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Partial Prerendering Demo</h1>
        <p className="text-muted-foreground mb-8">
          This page demonstrates PPR - the static shell renders immediately while dynamic content streams in.
        </p>

        {/* Static content - renders immediately */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">Static Shell (Immediate)</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This content is static and renders immediately as part of the prerendered shell.</p>
            <p className="text-sm text-muted-foreground mt-2">Page loaded at: {new Date().toLocaleTimeString()}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Suspense fallback={<LoadingCard title="Fast Content" delay="2s" />}>
            <FastComponent />
          </Suspense>

          <Suspense fallback={<LoadingCard title="Medium Content" delay="4s" />}>
            <MediumComponent />
          </Suspense>

          <Suspense fallback={<LoadingCard title="Slow Content" delay="6s" />}>
            <SlowComponent />
          </Suspense>

          <Suspense fallback={<LoadingCard title="Very Slow Content" delay="8s" />}>
            <VerySlowComponent />
          </Suspense>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">What's happening:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. Static shell (blue card) renders immediately</li>
            <li>2. Loading skeletons show for dynamic content</li>
            <li>3. Each component streams in as its data becomes available</li>
            <li>4. Faster components appear before slower ones</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
