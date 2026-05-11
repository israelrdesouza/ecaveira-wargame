import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './AnimatedNumber'

function AnimatedProgressBar({ value, animationKey, className, duration = 1800 }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const targetValue = Math.min(Math.max(Number(value) || 0, 0), 100)
  const [width, setWidth] = useState(prefersReducedMotion ? targetValue : 0)

  useEffect(() => {
    if (prefersReducedMotion) {
      setWidth(targetValue)
      return undefined
    }

    setWidth(0)
    const frame = requestAnimationFrame(() => {
      setWidth(targetValue)
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [animationKey, prefersReducedMotion, targetValue])

  return (
    <div
      className={className}
      style={{
        width: `${width}%`,
        transition: prefersReducedMotion
          ? 'none'
          : `width ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    />
  )
}

export default AnimatedProgressBar
