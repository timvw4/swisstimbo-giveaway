import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { scheduleNextDraw } from '@/utils/autoDrawing'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Démarrer le système de tirage automatique au chargement de l'app
    if (typeof window !== 'undefined') {
      console.log('Initialisation du système de tirage automatique...')
      scheduleNextDraw()
    }
  }, [])

  return <Component {...pageProps} />
} 