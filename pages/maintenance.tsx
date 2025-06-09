import React from 'react'
import { Wrench, Clock, Heart } from 'lucide-react'

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo SwissTimbo */}
        <div className="w-24 h-24 mx-auto mb-8">
          <img 
            src="/images/swisstimbo.jpg"
            alt="SwissTimbo"
            className="w-full h-full rounded-full object-cover shadow-lg"
          />
        </div>

        {/* Titre principal */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Swiss Timbo
        </h1>

        {/* Icône de maintenance */}
        <div className="flex justify-center mb-6">
          <div className="bg-dollar-green/10 p-4 rounded-full">
            <Wrench className="w-12 h-12 text-dollar-green animate-pulse" />
          </div>
        </div>

        {/* Message principal */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-4">
          Maintenance en cours
        </h2>

        <p className="text-gray-600 mb-6 leading-relaxed">
          Nous améliorons notre site pour vous offrir une meilleure expérience. 
          Les tirages au sort continuent comme prévu !
        </p>

        {/* Informations sur les tirages */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-center">
            <Clock className="w-5 h-5 mr-2 text-dollar-green" />
            Tirages maintenus
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            📅 Mercredis et dimanches à 20h
          </p>
          <p className="text-sm text-gray-600">
            💰 20 CHF à gagner par tirage
          </p>
        </div>

        {/* Estimation de retour */}
        <div className="bg-dollar-green/5 border border-dollar-green/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Retour estimé :</strong> Dans quelques heures
          </p>
        </div>

        {/* Message de remerciement */}
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <Heart className="w-4 h-4 mr-1 text-red-400" />
          Merci pour votre patience
        </p>

        {/* Lien vers Instagram */}
        <div className="mt-8">
          <a 
            href="https://instagram.com/swiss.timbo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-dollar-green hover:text-dollar-green/80 transition-colors"
          >
            📱 Suivez-nous sur Instagram
          </a>
        </div>

        {/* Auto-refresh notice */}
        <div className="mt-6 text-xs text-gray-400">
          Cette page se rafraîchit automatiquement
        </div>
      </div>

      {/* Script auto-refresh toutes les 30 secondes */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              window.location.reload();
            }, 30000);
          `,
        }}
      />
    </div>
  )
} 