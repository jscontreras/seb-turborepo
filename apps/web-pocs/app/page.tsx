import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      <h1 className="text-4xl font-bold text-center">
        Welcome to Next.js Version Display
      </h1>
      <p className="text-xl text-center text-muted-foreground">
        Check out the installed Next.js version on the about page
      </p>
      <Button asChild size="lg" className="p-4">
        <Link href="/about">View Next.js Version</Link>
      </Button>
    </div>
  );
}
