"use client"

import { useEffect, useState } from "react"

export function CountdownSeconds({ seconds: initialSeconds }: { seconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (initialSeconds <= 0) return
    setSeconds(initialSeconds)
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [initialSeconds])

  return (
    <span className="font-semibold text-orange-500 tabular-nums">{seconds}</span>
  )
}
