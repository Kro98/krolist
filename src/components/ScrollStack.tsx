import { useLayoutEffect, useRef, useCallback } from 'react'
import Lenis from 'lenis'
import './ScrollStack.css'

export const ScrollStackItem = ({ children, itemClassName = '' }: { children: React.ReactNode, itemClassName?: string }) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
)

interface ScrollStackProps {
  children: React.ReactNode
  className?: string
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string
  scaleEndPosition?: string
  baseScale?: number
  rotationAmount?: number
  blurAmount?: number
  useWindowScroll?: boolean
  onStackComplete?: () => void
}

const ScrollStack = ({
  children,
  className = '',
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = '25%',
  scaleEndPosition = '10%',
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete
}: ScrollStackProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const cardsRef = useRef<Element[]>([])
  const isUpdatingRef = useRef(false)
  const lastTransformsRef = useRef(new Map())
  const stackCompletedRef = useRef(false)

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop < start) return 0
    if (scrollTop > end) return 1
    return (scrollTop - start) / (end - start)
  }, [])

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === 'string' && value.includes('%'))
      return (parseFloat(value) / 100) * containerHeight
    return parseFloat(value as string)
  }, [])

  const getScrollData = useCallback(() => {
    if (useWindowScroll) {
      return {
        scrollTop: window.scrollY,
        containerHeight: window.innerHeight
      }
    } else {
      const scroller = scrollerRef.current
      return {
        scrollTop: scroller?.scrollTop || 0,
        containerHeight: scroller?.clientHeight || 0
      }
    }
  }, [useWindowScroll])

  const getElementOffset = useCallback(
    (element: Element) => {
      const htmlElement = element as HTMLElement
      return useWindowScroll ? element.getBoundingClientRect().top + window.scrollY : htmlElement.offsetTop
    },
    [useWindowScroll]
  )

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return
    isUpdatingRef.current = true

    const { scrollTop, containerHeight } = getScrollData()
    const stackPositionPx = parsePercentage(stackPosition, containerHeight)
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight)

    const endElement = useWindowScroll
      ? document.querySelector('.scroll-stack-end')
      : scrollerRef.current?.querySelector('.scroll-stack-end')
    const endElementTop = endElement ? getElementOffset(endElement) : 0

    cardsRef.current.forEach((card, i) => {
      const cardTop = getElementOffset(card)
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * i
      const triggerEnd = cardTop - scaleEndPositionPx
      const pinStart = triggerStart
      const pinEnd = endElementTop - containerHeight / 2

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
      const targetScale = baseScale + i * itemScale
      const scale = 1 - scaleProgress * (1 - targetScale)
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0

      let translateY = 0
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd
      if (isPinned) translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * i
      else if (scrollTop > pinEnd) translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * i

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100
      }

      const lastTransform = lastTransformsRef.current.get(i)
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1

      if (hasChanged) {
        const htmlCard = card as HTMLElement
        htmlCard.style.transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`
        lastTransformsRef.current.set(i, newTransform)
      }

      if (i === cardsRef.current.length - 1) {
        const inView = scrollTop >= pinStart && scrollTop <= pinEnd
        if (inView && !stackCompletedRef.current) {
          stackCompletedRef.current = true
          onStackComplete?.()
        } else if (!inView && stackCompletedRef.current) {
          stackCompletedRef.current = false
        }
      }
    })
    isUpdatingRef.current = false
  }, [
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    rotationAmount,
    useWindowScroll,
    onStackComplete,
    calculateProgress,
    parsePercentage,
    getScrollData,
    getElementOffset
  ])

  const handleScroll = useCallback(() => updateCardTransforms(), [updateCardTransforms])

  const setupLenis = useCallback(() => {
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true, lerp: 0.1 })
    lenis.on('scroll', handleScroll)
    const raf = (t: number) => {
      lenis.raf(t)
      animationFrameRef.current = requestAnimationFrame(raf)
    }
    animationFrameRef.current = requestAnimationFrame(raf)
    lenisRef.current = lenis
  }, [handleScroll])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const cards = Array.from(
      useWindowScroll
        ? document.querySelectorAll('.scroll-stack-card')
        : scroller?.querySelectorAll('.scroll-stack-card') || []
    )
    cardsRef.current = cards

    cards.forEach((card, i) => {
      const htmlCard = card as HTMLElement
      if (i < cards.length - 1) htmlCard.style.marginBottom = `${itemDistance}px`
      htmlCard.style.willChange = 'transform, filter'
      htmlCard.style.transformOrigin = 'top center'
      htmlCard.style.backfaceVisibility = 'hidden'
    })

    setupLenis()
    updateCardTransforms()

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      lenisRef.current?.destroy()
      cardsRef.current = []
      lastTransformsRef.current.clear()
    }
  }, [itemDistance, setupLenis, updateCardTransforms, useWindowScroll])

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        <div className="scroll-stack-end" />
      </div>
    </div>
  )
}

export default ScrollStack
