import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'

interface Winner {
  id: string
  participant_id: string
  pseudoinstagram: string
  draw_date: string
  montant: number
}

export default function Home() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const { data, error } = await supabase
          .from('winners')
          .select('*')
          .order('draw_date', { ascending: false })

        if (error) {
          console.error('Erreur lors du chargement des gagnants:', error)
        } else {
          setWinners(data || [])
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWinners()
  }, [])

  // Fonction pour formater la date
  const formatDrawDate = (dateString: string) => {
    const date = new Date(dateString)
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    
    return `${jours[date.getDay()]} ${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`
  }

  return (
    <Layout>
      <div className="relative min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* En-tête avec logo */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6">
              <img 
                src="/images/swisstimbo.jpg"
                alt="SwissTimbo"
                className="w-full h-full rounded-full object-cover shadow-lg"
              />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Swiss Timbo
            </h1>
            
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded-lg">
              <p className="text-lg font-semibold">
                ⚠️ Site en transition - Tirages temporairement suspendus
              </p>
            </div>
          </div>

          {/* Message principal */}
          <div className="bg-white rounded-xl shadow-xl p-8 mb-12 border border-gray-200">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                🎉 Nouvelle ère SwissTimbo en préparation !
              </h2>
              
              <div className="space-y-6 text-lg text-gray-700">
                <p>
                  <strong>Cher(e)s participant(e)s,</strong>
                </p>
                
                <p>
                  Nous sommes ravis de vous annoncer que nous préparons actuellement <br />
                  <span className="font-bold text-red-600"> la première loterie gratuite de Suisse</span> !
                </p>
                
                <div className="bg-gradient-to-r from-green-700 to-green-400 border-2 border-green-600 rounded-lg p-6 my-6">
                  <h3 className="text-xl font-bold text-white mb-3">
                    🚀 Ce qui vous attend :
                  </h3>
                  <ul className="text-left space-y-2 text-white">
                    <li>• <strong>Nouveau site web</strong> moderne et intuitif</li>
                    <li>• <strong>Première loterie gratuite</strong> de Suisse romande</li>
                    <li>• <strong>Expérience utilisateur</strong> améliorée</li>
                    <li>• <strong>Plus de tirages</strong> et de gains à gagner</li>
                  </ul>
                </div>
                
                <p>
                  <strong>Les tirages sont temporairement suspendus</strong> pendant cette période de transition. 
                  Nous vous remercions pour votre patience et votre fidélité.
                </p>
                
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 border-2 border-purple-400 rounded-lg p-6 mt-6">
                  <p className="text-white font-semibold mb-3">
                    📢 Restez connectés sur Instagram pour être informés du lancement !
                  </p>
                  <div className="text-center">
                    <a 
                      href="https://instagram.com/swiss.timbo" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-100 underline font-bold text-lg"
                    >
                      @swiss.timbo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section des gagnants */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              🏆 Historique des Gagnants
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des gagnants...</p>
              </div>
            ) : winners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {winners.map((winner) => (
                  <div 
                    key={winner.id} 
                    className="bg-gradient-to-br from-green-100 to-blue-100 p-6 rounded-lg shadow-md border-2 border-green-300"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        🏆
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">
                        {winner.pseudoinstagram}
                      </h3>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {winner.montant} CHF
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatDrawDate(winner.draw_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  Aucun gagnant enregistré pour le moment.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-600">
            <p className="mb-4">
              Merci à tous nos participants pour leur confiance !
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
} 