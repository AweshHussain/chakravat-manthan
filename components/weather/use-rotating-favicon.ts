'use client'

import { useEffect } from 'react'

export function useRotatingFavicon() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const img = new Image()
    img.src = '/logo.png'

    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let angle = 0
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    let intervalId: number | null = null

    img.onload = () => {
      // Rotate 360 degrees smoothly: increased speed by 10% (3.96 deg / 100ms)
      intervalId = window.setInterval(() => {
        angle = (angle + 3.96) % 360
        ctx.clearRect(0, 0, 32, 32)
        ctx.save()
        ctx.translate(16, 16)
        ctx.rotate((angle * Math.PI) / 180)
        ctx.drawImage(img, -16, -16, 32, 32)
        ctx.restore()

        if (link) {
          link.href = canvas.toDataURL('image/png')
        }
      }, 100)
    }

    return () => {
      if (intervalId !== null) clearInterval(intervalId)
    }
  }, [])
}
