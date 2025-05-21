import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { scheduleNextDraw } from '@/utils/autoDrawing'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    scheduleNextDraw()
  }, [])

  return <Component {...pageProps} />
} 