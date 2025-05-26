import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import Countdown from 'react-countdown'
import { Participant } from '@/types'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

// Import dynamique du composant PixelGrid
const PixelGrid = dynamic(() => import('@/components/PixelGrid'), {
  ssr: false
})

interface CountdownProps {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Tirage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getNextDrawDate = () => {
    const now = new Date()
    const day = now.getDay() // 0 = dimanche, 3 = mercredi
    const hours = now.getHours()
    let nextDate = new Date(now)
    
    if (day === 0) {
      // Si on est dimanche
      if (hours >= 20) {
        // Après 20h -> prochain mercredi
        nextDate.setDate(nextDate.getDate() + 3)
      }
    } else if (day < 3) {
      // Entre lundi et mardi -> prochain mercredi
      nextDate.setDate(nextDate.getDate() + (3 - day))
    } else if (day === 3) {
      // Si on est mercredi
      if (hours >= 20) {
        // Après 20h -> prochain dimanche
        nextDate.setDate(nextDate.getDate() + 4)
      }
    } else {
      // Entre jeudi et samedi -> prochain dimanche
      nextDate.setDate(nextDate.getDate() + (7 - day))
    }
    
    nextDate.setHours(20, 0, 0, 0)
    return nextDate
  }

  const saveWinner = async (winner: Participant) => {
    try {
      // Attendre la fin de l'animation
      await new Promise(resolve => setTimeout(resolve, 10000))

      // Sauvegarder le gagnant avec le bon nom de colonne
      const { error: winnerError } = await supabase
        .from('winners')
        .insert([{
          participant_id: winner.id,
          pseudoinstagram: winner.pseudoinstagram,
          draw_date: new Date().toISOString(),
          montant: 20
        }])

      if (winnerError) {
        console.error('Erreur lors de la sauvegarde:', winnerError)
        throw winnerError
      }

      // Nettoyer la liste des participants seulement après une sauvegarde réussie
      const { error: deleteError } = await supabase
        .from('participants')
        .delete()
        .neq('id', '0')

      if (deleteError) {
        console.error('Erreur lors du nettoyage des participants:', deleteError)
      }

    } catch (err) {
      console.error('Erreur lors de la sauvegarde du gagnant:', err)
    }
  }

  const performDraw = () => {
    if (participants.length > 0) {
      setIsSpinning(true)
      const winnerIndex = Math.floor(Math.random() * participants.length)
      const selectedWinner = participants[winnerIndex]
      setWinner(selectedWinner)
      
      // Sauvegarder le gagnant après avoir défini le gagnant
      saveWinner(selectedWinner)
      
      // L'animation se termine automatiquement après 10 secondes
      setTimeout(() => {
        setIsSpinning(false)
      }, 10000)
    }
  }

  const handleCountdownComplete = () => {
    performDraw()
  }

  // Fonction pour tester le tirage
  const handleTestDraw = () => {
    if (participants.length > 0) {
      performDraw()
    } else {
      alert('Aucun participant disponible pour le test')
    }
  }

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('id, npa, pseudoinstagram, created_at')
        
        if (error) {
          console.error('Erreur lors de la récupération des participants:', error)
          return
        }

        if (data) {
          setParticipants(data)
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    fetchParticipants()
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Tirage au sort</h1>
        
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl mb-3 md:mb-4">Prochain tirage dans :</h2>
          <div className="text-2xl md:text-3xl font-bold">
            <Countdown 
              date={getNextDrawDate()} 
              onComplete={handleCountdownComplete}
              renderer={(props: CountdownProps) => (
                <span>
                  {props.days > 0 && `${props.days}j `}
                  {props.hours}h {props.minutes}m {props.seconds}s
                </span>
              )}
            />
          </div>
        </div>

        {/* Bouton de test - visible uniquement en développement */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleTestDraw}
            disabled={isSpinning}
            className="bg-dollar-green text-white px-6 py-2 rounded mb-6 hover:bg-opacity-90 transition disabled:opacity-50"
          >
            {isSpinning ? 'Tirage en cours...' : 'Tester le tirage'}
          </button>
        )}

        {isClient && participants.length > 0 ? (
          <div className="mb-6 md:mb-8">
            <PixelGrid
              participants={participants}
              isSpinning={isSpinning}
              winner={winner}
              onStopSpinning={() => setIsSpinning(false)}
            />
            
            {!isSpinning && winner && (
              <div className="bg-dollar-green text-white p-4 md:p-6 rounded-lg mt-6">
                <h3 className="text-xl md:text-2xl mb-2">Félicitations !</h3>
                <p className="text-lg md:text-xl">
                  Le gagnant est : <strong>{winner.pseudoinstagram}</strong>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-lg md:text-xl">Aucun participant pour le moment</p>
        )}
      </div>
    </Layout>
  )
} 