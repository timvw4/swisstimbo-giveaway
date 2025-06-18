import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSessionTracking } from '@/hooks/useSessionTracking'
import { Analytics } from '@vercel/analytics/next'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({ 
  children, 
  title = "Swiss Timbo - Site en transition",
  description = "SwissTimbo prépare la première loterie gratuite de Suisse romande. Site en transition - Tirages temporairement suspendus."
}: LayoutProps) {
  // 🔐 NOUVEAU : État pour le compteur admin caché
  const [adminClickCount, setAdminClickCount] = useState(0)
  const router = useRouter()
  
  // 🔧 NOUVEAU : Activer le tracking de session pour tous les utilisateurs
  useSessionTracking()
  
  // 🔐 MODIFIÉ : Fonction pour gérer la redirection admin cachée
  const handleLogoClick = () => {
    setAdminClickCount(prev => {
      const newCount = prev + 1
      
      if (newCount >= 5) {
        // Redirection directe vers l'admin
        router.push('/admin')
        return 0
      }
      
      // Reset après 2 secondes d'inactivité
      setTimeout(() => setAdminClickCount(0), 2000)
      return newCount
    })
  }
  
  // 🔧 CORRECTION : Gérer les URLs selon l'environnement
  const isDevelopment = process.env.NODE_ENV === 'development'
  const siteUrl = isDevelopment 
    ? 'http://localhost:3000' 
    : (process.env.NEXT_PUBLIC_SITE_URL || "https://swisstimbo-giveaway.vercel.app")
  
  // 🔧 CORRECTION : En développement, utiliser un chemin relatif pour l'image
  const imageUrl = isDevelopment 
    ? '/images/swisstimbo.jpg' 
    : `${siteUrl}/images/swisstimbo.jpg`

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Police Poppins */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* 🎨 FAVICON ET ICÔNES - Swiss Timbo */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph / Facebook */}
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
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@swiss.timbo" />
        <meta name="twitter:creator" content="@swiss.timbo" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content="Swiss Timbo - Logo du tirage au sort gratuit" />
        
        {/* Métadonnées supplémentaires */}
        <meta name="author" content="Swiss Timbo" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#bc0b0b" />
        <meta name="msapplication-TileColor" content="#bc0b0b" />
        <link rel="canonical" href={siteUrl} />
        
        {/* 🔧 CORRECTION : Supprimer la CSP en développement */}
        {!isDevelopment && (
          <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        )}
      </Head>
      
      <div className="min-h-screen bg-white font-old-style">
        <nav className="bg-dollar-green text-white p-4">
          <div className="container mx-auto">
            <div className="flex justify-center items-center">
              <div 
                className="text-xl md:text-2xl font-bold cursor-pointer select-none hover:text-light-gray"
                onClick={handleLogoClick}
                title="Cliquez 5 fois rapidement pour accéder aux options avancées"
              >
                @Swiss.Timbo
              </div>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        
        <footer className="bg-light-gray p-4 mt-8">
          <div className="container mx-auto text-center text-sm md:text-base">
            <div className="mt-2">
              <a 
                href="https://instagram.com/swiss.timbo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-dollar-green hover:text-red-700 transition-colors font-medium underline"
              >
                📸 Suivez-nous sur @swiss.timbo
              </a>
            </div>
            <p>© 2025 Swiss Timbo - Tous droits réservés</p>
          </div>
        </footer>
      </div>
      
      {/* 📊 Vercel Analytics */}
      <Analytics />
    </>
  )
} 