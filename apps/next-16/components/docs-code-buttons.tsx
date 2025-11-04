import { Button } from "@repo/ui/components/ui/button"
import Link from "next/link"

interface DocsCodeButtonsProps {
  docsUrl: string
  codeUrl: string
}

export function DocsCodeButtons({ docsUrl, codeUrl }: DocsCodeButtonsProps) {
  return (
    <div className="flex gap-3 pt-4">
      <Button asChild className="border-2 border-primary">
        <Link href={docsUrl}>Docs</Link>
      </Button>
      <Button variant="secondary" asChild className="border-2 border-primary">
        <Link href={codeUrl}>Code</Link>
      </Button>
    </div>
  )
}
