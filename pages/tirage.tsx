import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'
import { Participant } from '@/types'
import { useRouter } from 'next/router'
import { Crown } from 'lucide-react'
import { getNextDrawDate } from '@/utils/dateUtils'

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

// Interface pour les données persistées dans localStorage
interface PostDrawState {
  frozenParticipants: Participant[]
  winner: Participant
  endTime: number // timestamp de fin de la période de 5 minutes
}

export default function Tirage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [frozenParticipants, setFrozenParticipants] = useState<Participant[]>([])
  const [previousWinners, setPreviousWinners] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showWinnerMessage, setShowWinnerMessage] = useState(false)
  const [isInPostDrawPeriod, setIsInPostDrawPeriod] = useState(false)
  const [lastCheckedWinner, setLastCheckedWinner] = useState<string | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    setIsClient(true)
    
    // Vérifier s'il y a un état post-tirage persisté
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('postDrawState')
      if (savedState) {
        try {
          const state: PostDrawState = JSON.parse(savedState)
          const now = Date.now()
          
          if (now < state.endTime) {
            setFrozenParticipants(state.frozenParticipants)
            setWinner(state.winner)
            setIsInPostDrawPeriod(true)
            setIsSaved(true)
            setShowWinnerMessage(true)
            setLastCheckedWinner(state.winner.id)
            
            const remainingTime = state.endTime - now
            setTimeout(() => {
              clearPostDrawState()
            }, remainingTime)
          } else {
            localStorage.removeItem('postDrawState')
          }
        } catch (error) {
          console.error('Erreur lors de la restauration de l\'état:', error)
          localStorage.removeItem('postDrawState')
        }
      }
    }
  }, [])

  // Fonction pour sauvegarder l'état post-tirage
  const savePostDrawState = (participants: Participant[], winner: Participant) => {
    if (typeof window !== 'undefined') {
      const endTime = Date.now() + (5 * 60 * 1000) // 5 minutes à partir de maintenant
      const state: PostDrawState = {
        frozenParticipants: participants,
        winner,
        endTime
      }
      localStorage.setItem('postDrawState', JSON.stringify(state))
    }
  }

  // Fonction pour nettoyer l'état post-tirage
  const clearPostDrawState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('postDrawState')
    }
    
    // Réinitialiser tous les états
    setFrozenParticipants([])
    setWinner(null)
    setIsSaved(false)
    setShowWinnerMessage(false)
    setIsInPostDrawPeriod(false)
  }

  // 🔧 NOUVEAU : Fonction pour détecter un nouveau tirage
  const checkForNewDraw = async () => {
    try {
      // Vérifier s'il y a un nouveau gagnant dans les 2 dernières minutes
      const recentTime = new Date()
      recentTime.setMinutes(recentTime.getMinutes() - 2)

      const { data: recentWinner } = await supabase
        .from('winners')
        .select('*')
        .gte('draw_date', recentTime.toISOString())
        .order('draw_date', { ascending: false })
        .limit(1)
        .single()

      if (recentWinner && recentWinner.id !== lastCheckedWinner && !isInPostDrawPeriod) {
        console.log('Nouveau tirage détecté !', recentWinner)
        
        const { data: historicalParticipants } = await supabase
          .from('participants_history')
          .select('*')
          .eq('draw_id', recentWinner.id)

        if (historicalParticipants) {
          setIsSpinning(true)
          setFrozenParticipants(historicalParticipants.map(p => ({
            id: p.id,
            pseudoinstagram: p.pseudoinstagram,
            npa: p.npa,
            created_at: p.created_at
          })))

          // Trouver le gagnant dans la liste
          const winnerData = {
            id: recentWinner.participant_id,
            pseudoinstagram: recentWinner.pseudoinstagram,
            npa: '', // On n'a pas le NPA dans la table winners
            created_at: recentWinner.draw_date
          }

          // Après 10 secondes d'animation, afficher le résultat
          setTimeout(() => {
            setWinner(winnerData)
            setIsSpinning(false)
            setShowWinnerMessage(true)
            setIsSaved(true)
            setIsInPostDrawPeriod(true)
            setLastCheckedWinner(recentWinner.id)

            // Mettre à jour la liste des gagnants précédents
            setPreviousWinners(prev => {
              if (!prev.includes(recentWinner.pseudoinstagram)) {
                return [...prev, recentWinner.pseudoinstagram]
              }
              return prev
            })

            // Sauvegarder l'état
            savePostDrawState(historicalParticipants.map(p => ({
              id: p.id,
              pseudoinstagram: p.pseudoinstagram,
              npa: p.npa,
              created_at: p.created_at
            })), winnerData)

            // Nettoyer après 5 minutes (gardé)
            setTimeout(() => {
              clearPostDrawState()
            }, 5 * 60 * 1000)
          }, 10000)
        }
      }
    } catch (error) {
      // Pas de nouveau tirage trouvé, c'est normal
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Vérifier d'abord s'il y a un nouveau tirage
        await checkForNewDraw()

        // Récupérer les participants actuels
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('id, npa, pseudoinstagram, created_at')
        
        if (participantsError) {
          console.error('Erreur lors de la récupération des participants:', participantsError)
          return
        }

        // Récupérer la liste des gagnants précédents
        const { data: winnersData, error: winnersError } = await supabase
          .from('winners')
          .select('pseudoinstagram')
        
        if (winnersError) {
          console.error('Erreur lors de la récupération des gagnants:', winnersError)
          return
        }

        // Mettre à jour les participants SEULEMENT si on n'est pas en période post-tirage
        if (participantsData && !isInPostDrawPeriod) {
          setParticipants(participantsData)
        }

        if (winnersData) {
          const winnerPseudos = winnersData.map(winner => winner.pseudoinstagram)
          setPreviousWinners(winnerPseudos)
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    // Vérifier plus fréquemment pendant les heures de tirage
    const now = new Date()
    const isDrawTime = (now.getDay() === 0 || now.getDay() === 3) && now.getHours() === 20
    const interval = setInterval(fetchData, isDrawTime ? 5000 : 30000) // 5s pendant tirage, 30s sinon
    
    fetchData()

    return () => clearInterval(interval)
  }, [isInPostDrawPeriod, lastCheckedWinner])

  const displayedParticipants = isInPostDrawPeriod ? frozenParticipants : participants

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
                onComplete={() => {}} // Plus de fonction car tirage automatique
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

        {isClient && displayedParticipants.length > 0 ? (
          <div className="mb-6 md:mb-8">
            {/* Message de félicitations */}
            {!isSpinning && winner && showWinnerMessage && (
              <div className="mb-6">
                <div className="bg-dollar-green text-white p-4 md:p-6 rounded-lg">
                  <h3 className="text-xl md:text-2xl mb-2">Félicitations !</h3>
                  <p className="text-lg md:text-xl">
                    Le gagnant est : <strong>{winner.pseudoinstagram}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Grille des participants */}
            <PixelGrid
              participants={displayedParticipants}
              previousWinners={previousWinners}
              isSpinning={isSpinning}
              winner={winner}
              onStopSpinning={() => setIsSpinning(false)}
            />
            
            {/* Message de réinitialisation */}
            {!isSpinning && winner && isSaved && (
              <div className="mt-6">
                <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
                  <p className="text-lg">
                    Le tirage est terminé ! Les participants seront réinitialisés dans 5 minutes.
                  </p>
                </div>
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