import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  // 🔧 CORRECTION : Suppression du système de tirage automatique interne
  // On garde seulement le système CRON externe pour éviter les conflits

  return <Component {...pageProps} />
}

// Déclaration TypeScript pour la variable globale
declare global {
  interface Window {
    __drawSystemInitialized?: boolean
  }
} 