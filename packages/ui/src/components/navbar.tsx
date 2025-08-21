import Link from "next/link";
import { Button } from "@repo/ui/components/button";

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Next.js Info
        </Link>
        <nav>
          <ul className="flex items-center gap-4">
            <li>
              <Button variant="ghost" asChild>
                <Link href="/">Home</Link>
              </Button>
            </li>
            <li>
              <Button variant="ghost" asChild>
                <Link href="/about">About</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
