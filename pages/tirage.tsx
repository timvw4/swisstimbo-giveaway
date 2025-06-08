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
  const [countdownCompleted, setCountdownCompleted] = useState(false)
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
      // 🔧 AMÉLIORATION : Vérifier s'il y a un nouveau gagnant dans les 10 dernières minutes au lieu de 2
      const recentTime = new Date()
      recentTime.setMinutes(recentTime.getMinutes() - 10)

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

        if (historicalParticipants && historicalParticipants.length > 0) {
          console.log(`Participants historiques récupérés: ${historicalParticipants.length}`)
          
          // 🔧 AMÉLIORATION : Démarrer l'animation immédiatement
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

          // 🔧 AMÉLIORATION : Après 10 secondes d'animation, afficher le résultat
          setTimeout(() => {
            console.log('Animation terminée, affichage du gagnant')
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

            // Nettoyer après 5 minutes
            setTimeout(() => {
              console.log('Nettoyage de l\'état post-tirage')
              clearPostDrawState()
            }, 5 * 60 * 1000)
          }, 10000)
        } else {
          console.log('Aucun participant historique trouvé pour ce tirage')
        }
      }
    } catch (error) {
      // Pas de nouveau tirage trouvé, c'est normal
      if (error instanceof Error && !error.message.includes('PGRST116')) {
        console.error('Erreur lors de la vérification de nouveau tirage:', error)
      }
    }
  }

  // 🔧 NOUVELLE : Fonction appelée quand le décompte arrive à zéro
  const handleCountdownComplete = () => {
    console.log('🎯 Décompte terminé ! Début de l\'animation immédiate...')
    setCountdownCompleted(true)
    
    // Démarrer l'animation immédiatement avec les participants actuels
    if (participants.length > 0) {
      setIsSpinning(true)
      setFrozenParticipants([...participants])
      
      // Vérifier intensivement s'il y a un nouveau tirage (toutes les 2 secondes)
      const checkInterval = setInterval(async () => {
        console.log('🔍 Vérification intensive du nouveau tirage...')
        const hasNewDraw = await checkForNewDrawImmediate()
        
        if (hasNewDraw) {
          clearInterval(checkInterval)
        }
      }, 2000)
      
      // Si aucun tirage n'est détecté après 30 secondes, arrêter l'animation
      setTimeout(() => {
        if (isSpinning && !winner) {
          console.log('⏰ Timeout : Arrêt de l\'animation, aucun tirage détecté')
          setIsSpinning(false)
          clearInterval(checkInterval)
        }
      }, 30000)
    }
  }

  // 🔧 NOUVELLE : Version immédiate de la vérification pour le countdown
  const checkForNewDrawImmediate = async (): Promise<boolean> => {
    try {
      // Vérifier s'il y a un nouveau gagnant dans la dernière minute
      const recentTime = new Date()
      recentTime.setMinutes(recentTime.getMinutes() - 1)

      const { data: recentWinner } = await supabase
        .from('winners')
        .select('*')
        .gte('draw_date', recentTime.toISOString())
        .order('draw_date', { ascending: false })
        .limit(1)
        .single()

      if (recentWinner && recentWinner.id !== lastCheckedWinner) {
        console.log('🎉 Nouveau tirage détecté après countdown !', recentWinner)
        
        const { data: historicalParticipants } = await supabase
          .from('participants_history')
          .select('*')
          .eq('draw_id', recentWinner.id)

        if (historicalParticipants && historicalParticipants.length > 0) {
          // Trouver le gagnant dans la liste
          const winnerData = {
            id: recentWinner.participant_id,
            pseudoinstagram: recentWinner.pseudoinstagram,
            npa: '',
            created_at: recentWinner.draw_date
          }

          // Continuer l'animation pendant 8 secondes puis afficher le résultat
          setTimeout(() => {
            console.log('🏆 Animation terminée, affichage du gagnant après countdown')
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

            // Nettoyer après 5 minutes
            setTimeout(() => {
              console.log('🧹 Nettoyage de l\'état post-tirage après countdown')
              clearPostDrawState()
            }, 5 * 60 * 1000)
          }, 8000)
          
          return true
        }
      }
      return false
    } catch (error) {
      console.log('🔍 Pas encore de nouveau tirage détecté (normal)')
      return false
    }
  }

  // 🛠️ DÉVELOPPEMENT : Fonction pour tester le tirage automatique
  const handleTestAutoDraw = async () => {
    if (process.env.NODE_ENV !== 'development') return
    
    console.log('🧪 TEST : Déclenchement du tirage automatique...')
    
    if (participants.length === 0) {
      alert('Aucun participant pour tester le tirage !')
      return
    }

    try {
      // Déclencher l'API de tirage automatique
      const response = await fetch('/api/perform-draw', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('🧪 TEST : Tirage automatique réussi !', result.winner)
        
        // Déclencher immédiatement l'animation comme si le countdown était fini
        handleCountdownComplete()
        
      } else {
        console.error('🧪 TEST : Erreur tirage automatique:', result.error)
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      console.error('🧪 TEST : Erreur API:', error)
      alert('Erreur lors de l\'appel API')
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
                onComplete={handleCountdownComplete} // 🔧 NOUVELLE : Animation immédiate !
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

        {/* 🛠️ DÉVELOPPEMENT : Bouton de test - toujours visible en dev */}
        {isClient && process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-3 text-yellow-800">🛠️ Mode Développement</h3>
            <button
              onClick={handleTestAutoDraw}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded transition-colors font-semibold w-full"
              disabled={isSpinning}
            >
              🎯 Tester le tirage automatique
            </button>
            <p className="text-sm text-yellow-700 mt-2">
              Ce bouton n'est visible qu'en mode développement
            </p>
          </div>
        )}

        {isClient && displayedParticipants.length > 0 ? (
          <div className="mb-6 md:mb-8">
            {/* Animation en cours après countdown */}
            {isSpinning && countdownCompleted && !winner && (
              <div className="mb-6">
                <div className="bg-blue-500 text-white p-4 md:p-6 rounded-lg">
                  <h3 className="text-xl md:text-2xl mb-2">🎲 Tirage en cours...</h3>
                  <p className="text-lg md:text-xl">
                    Le gagnant va être sélectionné ! 
                  </p>
                </div>
              </div>
            )}

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