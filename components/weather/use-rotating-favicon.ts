'use client'

import { useEffect } from 'react'

export function useRotatingFavicon() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const img = new Image()
    img.src = '/logo.png'

    const canvas = document.createElement('canvas')
    // 64x64 for crystal clear, high-DPI retina rendering
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    let angle = 0
    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")

    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }

    let intervalId: number | null = null

    img.onload = () => {
      // 30 FPS update rate (33ms) with 1.307 deg/frame gives identical overall speed (~9.1 sec / 360 deg) but ultra-fluid motion
      const degPerTick = 1.307
      intervalId = window.setInterval(() => {
        angle = (angle + degPerTick) % 360
        ctx.clearRect(0, 0, 64, 64)
        ctx.save()
        ctx.translate(32, 32)
        ctx.rotate((angle * Math.PI) / 180)
        ctx.drawImage(img, -32, -32, 64, 64)
        ctx.restore()

        if (link) {
          link.href = canvas.toDataURL('image/png')
        }
      }, 33)
    }

    return () => {
      if (intervalId !== null) clearInterval(intervalId)
    }
  }, [])
}
