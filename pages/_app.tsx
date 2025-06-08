import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { scheduleNextDraw } from '@/utils/autoDrawing'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // 🔧 CORRECTION : S'assurer qu'un seul système de tirage automatique est actif
    if (typeof window !== 'undefined' && !window.__drawSystemInitialized) {
      console.log('Initialisation du système de tirage automatique...')
      window.__drawSystemInitialized = true
      scheduleNextDraw()
    }
  }, [])

  return <Component {...pageProps} />
}

// Déclaration TypeScript pour la variable globale
declare global {
  interface Window {
    __drawSystemInitialized?: boolean
  }
} 