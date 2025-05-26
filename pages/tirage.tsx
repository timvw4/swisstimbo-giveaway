import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'
import { Participant } from '@/types'
import { useRouter } from 'next/router'

// Import dynamique de PixelGrid
const PixelGrid = dynamic(() => import('@/components/PixelGrid'), {
  ssr: false
})

// Définir l'interface pour les props du Countdown
interface CountdownProps {
  date: Date | number
  onComplete: () => void
  renderer: (props: CountdownRenderProps) => JSX.Element
}

// Définir l'interface pour les props du renderer
interface CountdownRenderProps {
  days: number
  hours: number
  minutes: number
  seconds: number
}

// Rendre le Countdown uniquement côté client
const Countdown = dynamic<CountdownProps>(() => import('react-countdown'), {
  ssr: false,  // Désactive le rendu côté serveur
})

export default function Tirage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
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
      await new Promise(resolve => setTimeout(resolve, 10000))

      // Sauvegarde le gagnant dans la table winners
      const { error: winnerError } = await supabase
        .from('winners')
        .insert([{
          participant_id: winner.id,
          pseudoinstagram: winner.pseudoinstagram,
          draw_date: new Date().toISOString(),
          montant: 20
        }])

      if (winnerError) {
        console.error('Erreur lors de la sauvegarde du gagnant:', winnerError)
        throw winnerError
      }

      // Nettoie la liste des participants - supprime tous les participants
      const { error: deleteError } = await supabase
        .from('participants')
        .delete()
        .not('id', 'is', null)

      if (deleteError) {
        console.error('Erreur lors de la suppression des participants:', deleteError)
        throw deleteError
      }

      setIsSaved(true)
      
      // Mettre à jour la liste des participants
      setParticipants([])
      
      // Redirection après 5 secondes
      setTimeout(() => {
        router.push('/gagnants')
      }, 5000)

    } catch (err) {
      console.error('Erreur lors de la sauvegarde du gagnant:', err)
    }
  }

  const handleTestDraw = () => {
    console.log("Nombre de participants:", participants.length)
    if (participants.length > 0) {
      console.log("Début du tirage test")
      performDraw()
    } else {
      console.log("Aucun participant trouvé")
      alert('Aucun participant disponible pour le test')
    }
  }

  const performDraw = () => {
    if (participants.length > 0) {
      setIsSpinning(true)
      console.log("Animation démarrée")
      const winnerIndex = Math.floor(Math.random() * participants.length)
      const selectedWinner = participants[winnerIndex]
      console.log("Gagnant sélectionné:", selectedWinner)
      setWinner(selectedWinner)
      
      saveWinner(selectedWinner)
      
      setTimeout(() => {
        console.log("Fin de l'animation")
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

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchParticipants, 30000)
    fetchParticipants() // Première exécution

    return () => clearInterval(interval) // Nettoyage à la destruction du composant
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Tirage au sort</h1>
        
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl mb-3 md:mb-4">Prochain tirage dans :</h2>
          {isClient && (
            <div className="text-2xl md:text-3xl font-bold">
              <Countdown 
                date={getNextDrawDate()} 
                onComplete={handleCountdownComplete}
                renderer={(props: CountdownRenderProps) => (
                  <span>
                    {props.days > 0 && `${props.days}j `}
                    {props.hours}h {props.minutes}m {props.seconds}s
                  </span>
                )}
              />
            </div>
          )}
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
              <div className="space-y-4">
                <div className="bg-dollar-green text-white p-4 md:p-6 rounded-lg mt-6">
                  <h3 className="text-xl md:text-2xl mb-2">Félicitations !</h3>
                  <p className="text-lg md:text-xl">
                    Le gagnant est : <strong>{winner.pseudoinstagram}</strong>
                  </p>
                </div>
                
                {isSaved && (
                  <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
                    <p className="text-lg">
                      Le tirage est terminé ! Redirection vers la page des gagnants dans quelques secondes...
                    </p>
                  </div>
                )}
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