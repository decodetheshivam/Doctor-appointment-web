import { useEffect, useRef, useState } from 'react'

interface Options {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: Options = {}
) {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, visible }
}

/** Staggered reveal - returns array of style objects */
export function staggerStyle(
  visible: boolean,
  index: number,
  baseDelay = 0,
  stepDelay = 80
): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.6s ease ${baseDelay + index * stepDelay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${baseDelay + index * stepDelay}ms`,
  }
}

/** Simple fade-up style */
export function fadeUpStyle(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(32px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  }
}

/** Fade-in from left */
export function fadeLeftStyle(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0)' : 'translateX(-40px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  }
}

/** Fade-in from right */
export function fadeRightStyle(visible: boolean, delay = 0): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0)' : 'translateX(40px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  }
}
