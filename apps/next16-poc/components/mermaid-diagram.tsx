"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  chart: string
  className?: string
}

// Initialize mermaid once - this is safe to do at module level for client components
// Mermaid initialization is idempotent
let mermaidInitialized = false

function initializeMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "inherit",
    })
    mermaidInitialized = true
  }
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>("")

  // Memoize the diagram ID based on chart content to avoid re-rendering
  // when the same chart is passed (important for cached server components)
  const diagramId = useMemo(() => {
    // Create a stable ID based on chart content hash
    // This ensures the same chart always gets the same ID, improving caching
    return `mermaid-${btoa(chart).slice(0, 12).replace(/[+/=]/g, '')}`
  }, [chart])

  useEffect(() => {
    // Initialize mermaid (only once)
    initializeMermaid()

    // Render the diagram
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(diagramId, chart)
        setSvg(svg)
      } catch (error) {
        console.error("Error rendering mermaid diagram:", error)
      }
    }

    renderDiagram()
  }, [chart, diagramId])

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center overflow-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

