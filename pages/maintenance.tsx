import React from 'react'
import Head from 'next/head'
import { Wrench, Clock, AlertCircle } from 'lucide-react'

export default function Maintenance() {
  return (
    <>
      <Head>
        <title>Maintenance - Swiss Timbo</title>
        <meta name="description" content="Site en maintenance - Swiss Timbo sera bientôt de retour" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Empêcher l'indexation de cette page */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-dollar-green to-green-600 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-6">
            <img 
              src="/images/swisstimbo.jpg"
              alt="Swiss Timbo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          
          {/* Icône de maintenance */}
          <div className="mb-6">
            <Wrench size={48} className="text-dollar-green mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Maintenance en cours
            </h1>
          </div>
          
          {/* Message principal */}
          <div className="mb-8">
            <p className="text-gray-600 text-lg mb-4">
              Nous améliorons actuellement notre site pour vous offrir une meilleure expérience.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle size={20} className="text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">Information importante</span>
              </div>
              <p className="text-yellow-700 text-sm">
                Les tirages continuent normalement selon le planning habituel (mercredis et dimanches à 20h).
              </p>
            </div>
          </div>
          
          {/* Temps estimé */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-3">
              <Clock size={20} className="text-gray-500 mr-2" />
              <span className="text-gray-700 font-medium">Retour estimé</span>
            </div>
            <p className="text-2xl font-bold text-dollar-green">
              Bientôt disponible
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Nous travaillons pour revenir le plus rapidement possible
            </p>
          </div>
          
          {/* Contact */}
          <div className="border-t pt-6">
            <p className="text-gray-600 text-sm mb-2">
              Une question ? Contactez-nous :
            </p>
            <a 
              href="https://instagram.com/swiss.timbo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-dollar-green hover:text-green-600 font-medium"
            >
              @swiss.timbo
            </a>
          </div>
          
          {/* Animation de chargement */}
          <div className="mt-8">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-dollar-green rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-dollar-green rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-dollar-green rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 