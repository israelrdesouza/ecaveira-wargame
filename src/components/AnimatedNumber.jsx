import { useEffect, useMemo, useState } from 'react'

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function updatePreference() {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => {
      mediaQuery.removeEventListener('change', updatePreference)
    }
  }, [])

  return prefersReducedMotion
}

function defaultFormat(value, decimals) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3)
}

function AnimatedNumber({
  value,
  duration = 1800,
  prefix = '',
  suffix = '',
  format,
  decimals = 0,
  animationKey,
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const numericValue = useMemo(() => {
    const nextValue = Number(value)
    return Number.isFinite(nextValue) ? nextValue : 0
  }, [value])
  const [displayValue, setDisplayValue] = useState(
    prefersReducedMotion ? numericValue : 0,
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(numericValue)
      return undefined
    }

    let animationFrame = 0
    let startTime = 0
    const safeDuration = Math.max(Number(duration) || 0, 0)

    if (safeDuration === 0) {
      setDisplayValue(numericValue)
      return undefined
    }

    setDisplayValue(0)

    function step(timestamp) {
      if (!startTime) {
        startTime = timestamp
      }

      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / safeDuration, 1)
      const nextValue = numericValue * easeOutCubic(progress)

      setDisplayValue(nextValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      }
    }

    animationFrame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [animationKey, duration, numericValue, prefersReducedMotion])

  const formatter = format ?? ((nextValue) => defaultFormat(nextValue, decimals))

  return `${prefix}${formatter(displayValue)}${suffix}`
}

export default AnimatedNumber
