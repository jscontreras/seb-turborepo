import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Next.js Rendering Strategies Demo</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Partial Prerendering (PPR)</CardTitle>
              <CardDescription>Demonstrates PPR with static shell and streaming dynamic content</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Shows how PPR renders a static shell immediately while streaming dynamic content as it becomes
                available.
              </p>
              <Button asChild>
                <Link href="/ppr-poc/ppr">View PPR Demo</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Streaming Only</CardTitle>
              <CardDescription>Same logic but with force-static dynamic export</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Shows traditional streaming behavior where the entire page waits for all content to be ready.
              </p>
              <Button asChild>
                <Link href="/ppr-poc/only-streaming">View Streaming Demo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Key Differences</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">PPR (/ppr)</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Static shell renders immediately</li>
                <li>• Dynamic content streams in progressively</li>
                <li>• Better perceived performance</li>
                <li>• Fallback UI shows while loading</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Streaming (/only-streaming)</h3>
             <ul className="space-y-1 text-muted-foreground">
                <li>• Static shell renders immediately</li>
                <li>• Dynamic content streams in progressively</li>
                <li>• Better perceived performance</li>
                <li>• Fallback UI shows while loading</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
