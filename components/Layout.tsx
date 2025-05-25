import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-old-style">
      <Head>
        <title>Concours SwissTimbo</title>
        <meta name="description" content="Gagnez de l'argent avec @SwissTimbo" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className="bg-dollar-green text-white p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl md:text-2xl font-bold">
              @SwissTimbo
            </Link>
            
            {/* Bouton menu hamburger pour mobile */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Menu desktop */}
            <div className="hidden md:flex space-x-4">
              <Link href="/" className="hover:text-light-gray">
                Accueil
              </Link>
              <Link href="/inscription" className="hover:text-light-gray">
                Inscription
              </Link>
              <Link href="/tirage" className="hover:text-light-gray">
                Tirage
              </Link>
              <Link href="/about" className="hover:text-light-gray">
                À propos
              </Link>
              <Link href="/gagnants" className="hover:text-light-gray">
                Historique
              </Link>
              <Link href="/reglement" className="hover:text-light-gray">
                Règlement
              </Link>
            </div>
          </div>

          {/* Menu mobile */}
          <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden mt-4`}>
            <div className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className="hover:text-light-gray py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link 
                href="/inscription" 
                className="hover:text-light-gray py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Inscription
              </Link>
              <Link 
                href="/tirage" 
                className="hover:text-light-gray py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Tirages
              </Link>
              <Link 
                href="/gagnants" 
                className="hover:text-light-gray py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Historique
              </Link>
              <Link 
                href="/about" 
                className="hover:text-light-gray py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                À propos
              </Link>
              <Link 
                href="/reglement" 
                className="hover:text-light-gray py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Règlement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-light-gray p-4 mt-8">
        <div className="container mx-auto text-center text-sm md:text-base">
          <p>© 2025 Swiss Timbo - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
} 