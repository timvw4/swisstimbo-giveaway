import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import Countdown from 'react-countdown'
import { Participant } from '@/types'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

// Définir l'interface pour les props du renderer
interface RendererProps {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Import dynamique du composant DrawWheel
const DrawWheel = dynamic(() => import('@/components/DrawWheel'), {
  ssr: false
})

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
    let nextDate = new Date()
    
    if (day < 0 || (day === 0 && hours >= 20)) {
      // Prochain mercredi
      nextDate.setDate(nextDate.getDate() + ((3 + 7 - day) % 7))
    } else if (day < 3 || (day === 3 && hours >= 20)) {
      // Prochain dimanche
      nextDate.setDate(nextDate.getDate() + ((0 + 7 - day) % 7))
    } else {
      // Prochain dimanche
      nextDate.setDate(nextDate.getDate() + ((0 + 7 - day) % 7))
    }
    
    nextDate.setHours(20, 0, 0, 0)
    return nextDate
  }

  const saveWinner = async (winner: Participant) => {
    try {
      // Sauvegarder le gagnant dans la table winners
      const { error: winnerError } = await supabase
        .from('winners')
        .insert([{
          participant_id: winner.id,
          draw_date: new Date().toISOString(),
          pseudo_instagram: winner.pseudoinstagram,
          montant: 20 // Ajout du montant gagné
        }])

      if (winnerError) throw winnerError

      // Attendre 5 minutes puis réinitialiser les participants
      setTimeout(async () => {
        const { error: deleteError } = await supabase
          .from('participants')
          .delete()
          .neq('id', '0')  // Supprime tous les participants

        if (deleteError) console.error('Erreur lors de la réinitialisation:', deleteError)
        
        // Rafraîchir la page
        router.reload()
      }, 5 * 60 * 1000) // 5 minutes

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
      
      // Sauvegarder le gagnant
      saveWinner(selectedWinner)
      
      setTimeout(() => {
        setIsSpinning(false)
      }, 10000)
    }
  }

  const handleCountdownComplete = () => {
    performDraw()
  }

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('id, nom, age, pseudoinstagram, created_at')
        
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
              renderer={({ days, hours, minutes, seconds }: RendererProps) => (
                <span>
                  {days > 0 && `${days}j `}
                  {hours}h {minutes}m {seconds}s
                </span>
              )}
            />
          </div>
        </div>

        {isClient && participants.length > 0 ? (
          <div className="mb-6 md:mb-8">
            <div className="max-w-[280px] md:max-w-md mx-auto mb-6 md:mb-8">
              <DrawWheel
                participants={participants}
                isSpinning={isSpinning}
                winner={winner}
                onStopSpinning={() => setIsSpinning(false)}
              />
            </div>
            
            {!isSpinning && winner && (
              <div className="bg-dollar-green text-white p-4 md:p-6 rounded-lg">
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