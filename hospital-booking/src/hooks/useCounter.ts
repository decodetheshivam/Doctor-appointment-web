import { useEffect, useRef, useState } from 'react'

export function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!start || startedRef.current) return
    startedRef.current = true

    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [start, target, duration])

  return count
}
