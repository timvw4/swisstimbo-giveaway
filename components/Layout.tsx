import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({ 
  children, 
  title = "Swiss Timbo - Tirage au sort gratuit",
  description = "Participez gratuitement et gagnez 20 CHF ! Tirages tous les mercredis et dimanches à 20h. Inscription simple et rapide."
}: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const siteUrl = "https://swisstimbo-giveaway.vercel.app"
  const imageUrl = `${siteUrl}/images/swisstimbo.jpg`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook - Plus explicite */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:secure_url" content={imageUrl} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Swiss Timbo - Logo du tirage au sort gratuit" />
        <meta property="og:site_name" content="Swiss Timbo" />
        <meta property="og:locale" content="fr_CH" />
        
        {/* Twitter - Plus explicite */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@swiss.timbo" />
        <meta name="twitter:creator" content="@swiss.timbo" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content="Swiss Timbo - Logo du tirage au sort gratuit" />
        
        {/* Métadonnées supplémentaires pour Instagram */}
        <meta name="author" content="Swiss Timbo" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#22c55e" />
        <link rel="canonical" href={siteUrl} />
        
        {/* Sécurité */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </Head>
      
      <div className="min-h-screen bg-white font-old-style">
        <nav className="bg-dollar-green text-white p-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl md:text-2xl font-bold">
                @Swiss.Timbo
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
                <Link href="/gagnants" className="hover:text-light-gray">
                  Gagnants
                </Link>
                <Link href="/about" className="hover:text-light-gray">
                  À propos
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
                  Gagnants
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
    </>
  )
} 