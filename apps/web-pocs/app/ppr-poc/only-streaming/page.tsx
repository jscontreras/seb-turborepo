import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import Link from "next/link"
import { Button } from "@repo/ui/components/ui/button"
import { Suspense } from "react"
import { Skeleton } from "@repo/ui/components/ui/skeleton"
import { headers } from "next/headers"

export const dynamic = "force-static"
export const experimental_ppr = false

async function FastComponent() {
  const headersList = headers()
  console.log(`[v0] Fast Content (2s delay) starting at ${new Date().toLocaleTimeString()}`)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  console.log(`[v0] Fast Content (2s delay) finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="text-green-600">Fast Content (2s delay)</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after 2000ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

async function MediumComponent() {
  const headersList = headers()
  console.log(`[v0] Medium Content (4s delay) starting at ${new Date().toLocaleTimeString()}`)
  await new Promise((resolve) => setTimeout(resolve, 4000))
  console.log(`[v0] Medium Content (4s delay) finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-600">Medium Content (4s delay)</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after 4000ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

async function SlowComponent() {
  const headersList = headers()
  console.log(`[v0] Slow Content (6s delay) starting at ${new Date().toLocaleTimeString()}`)
  await new Promise((resolve) => setTimeout(resolve, 6000))
  console.log(`[v0] Slow Content (6s delay) finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-orange-600">Slow Content (6s delay)</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after 6000ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

async function VerySlowComponent() {
  const headersList = headers()
  console.log(`[v0] Very Slow Content (8s delay) starting at ${new Date().toLocaleTimeString()}`)
  await new Promise((resolve) => setTimeout(resolve, 8000))
  console.log(`[v0] Very Slow Content (8s delay) finished rendering at ${new Date().toLocaleTimeString()}`)

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Very Slow Content (8s delay)</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This content loaded after 8000ms delay</p>
        <p className="text-sm text-muted-foreground mt-2">Rendered at: {new Date().toLocaleTimeString()}</p>
      </CardContent>
    </Card>
  )
}

function LoadingCard({ title, delay }: { title: string; delay: string }) {
  return (
    <Card className="border-dashed border-2 border-orange-300 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-500 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-orange-400 border-t-transparent rounded-full"></div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-3/4 animate-pulse" />
          <div className="flex items-center gap-2 mt-3">
            <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="h-2 w-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <span className="text-xs text-orange-600 ml-2">Streaming {delay}...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StreamingPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/ppr-poc">← Back to Home</Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-2">Streaming Only Demo (force-static)</h1>
        <p className="text-muted-foreground mb-8">
          This page uses regular streaming without PPR - components stream in but no static shell is prerendered.
        </p>

        {/* Static content */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Static Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This content streams in with the rest of the page - no prerendered shell.</p>
            <p className="text-sm text-muted-foreground mt-2">Page loaded at: {new Date().toLocaleTimeString()}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingCard title="Fast Content" delay="2s" />}>
              <FastComponent />
            </Suspense>

            <Suspense fallback={<LoadingCard title="Medium Content" delay="4s" />}>
              <MediumComponent />
            </Suspense>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingCard title="Slow Content" delay="6s" />}>
              <SlowComponent />
            </Suspense>

            <Suspense fallback={<LoadingCard title="Very Slow Content" delay="8s" />}>
              <VerySlowComponent />
            </Suspense>
          </div>
        </div>

        <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="font-semibold text-orange-800 mb-2">What's happening:</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• When force-static is used, the entire page render as static, including the streaming components (Disable JS and reload to see it)</li>
            <li>• All content renders at once</li>
            <li>• Longer initial loading time</li>
            <li>• After full hyddration, streaming components will stream in (overriding the static content)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
