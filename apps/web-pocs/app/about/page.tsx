import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { getNextJsVersion } from "@/lib/get-nextjs-version";

export default async function AboutPage() {
  const version = await getNextJsVersion();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">About This App</CardTitle>
          <CardDescription>
            Information about the current Next.js installation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Next.js Version</h3>
              <div className="mt-2 flex items-center gap-2">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-mono">
                  {version}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This page displays the currently installed version of Next.js in
              this project. The version information is retrieved server-side
              using a Server Component.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
