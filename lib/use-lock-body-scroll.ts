// lib/use-lock-body-scroll.ts
import { useEffect } from 'react'

/**
 * Locks page scroll while `locked` is true. Used by every modal so the
 * background page can't scroll or pan behind it — this also prevents
 * mobile browsers from treating the page as horizontally pannable,
 * which previously could drag a `position: fixed` modal along with
 * a horizontal swipe gesture.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}