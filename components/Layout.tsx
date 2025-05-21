import React from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white font-old-style">
      <Head>
        <title>Concours Jacques Reverdin</title>
        <meta name="description" content="Gagnez de l'argent avec @Jacques_reverdin" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-dollar-green text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            @Jacques_reverdin
          </Link>
          <div className="space-x-4">
            <Link href="/" className="hover:text-light-gray">
              Accueil
            </Link>
            <Link href="/inscription" className="hover:text-light-gray">
              Inscription
            </Link>
            <Link href="/tirage" className="hover:text-light-gray">
              Tirage
            </Link>
            <Link href="/reglement" className="hover:text-light-gray">
              Règlement
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-light-gray p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© 2024 Jacques Reverdin - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
} 