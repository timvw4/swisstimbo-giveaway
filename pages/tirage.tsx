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
  completed: boolean
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
  // 🔧 NOUVEAU : État pour savoir si on attend un tirage
  const [waitingForDraw, setWaitingForDraw] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setIsClient(true)
    
    // 🔧 AMÉLIORATION : Vérifier s'il y a un état post-tirage persisté avec validation timestamp
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('postDrawState')
      if (savedState) {
        try {
          const state: PostDrawState = JSON.parse(savedState)
          const now = Date.now()
          
          // 🔧 NOUVEAU : Validation plus stricte avec le timestamp du tirage
          if (now < state.endTime) {
            console.log('🔄 Restauration de l\'état post-tirage depuis localStorage')
            console.log(`⏰ Temps restant: ${Math.round((state.endTime - now) / 1000)}s`)
            
            setFrozenParticipants(state.frozenParticipants)
            setWinner(state.winner)
            setIsInPostDrawPeriod(true)
            setIsSaved(true)
            setShowWinnerMessage(true)
            setLastCheckedWinner(state.winner.id)
            
            // 🔧 NOUVEAU : Ne PAS relancer d'animation, directement afficher le gagnant
            setIsSpinning(false) // S'assurer que l'animation n'est pas active
            setWaitingForDraw(false)
            
            const remainingTime = state.endTime - now
            setTimeout(() => {
              console.log('🧹 Nettoyage automatique de l\'état post-tirage (depuis localStorage)')
              clearPostDrawState()
            }, remainingTime)
          } else {
            console.log('🗑️ État post-tirage expiré, suppression du localStorage')
            localStorage.removeItem('postDrawState')
          }
        } catch (error) {
          console.error('❌ Erreur lors de la restauration de l\'état:', error)
          localStorage.removeItem('postDrawState')
        }
      } else {
        console.log('📭 Aucun état post-tirage sauvegardé')
      }
    }
  }, [])

  // Fonction pour sauvegarder l'état post-tirage
  const savePostDrawState = (participants: Participant[], winner: Participant, drawDate: string) => {
    if (typeof window !== 'undefined') {
      const endTime = new Date(drawDate).getTime() + (5 * 60 * 1000) // 5 minutes à partir de maintenant
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
    setWaitingForDraw(false)
  }

  // 🔧 AMÉLIORÉ : Fonction pour détecter un nouveau tirage (plus robuste)
  const checkForNewDraw = async () => {
    try {
      // 🔧 AMÉLIORATION : Vérifier s'il y a un nouveau gagnant dans les 15 dernières minutes
      const recentTime = new Date()
      recentTime.setMinutes(recentTime.getMinutes() - 15)

      const { data: recentWinner } = await supabase
        .from('winners')
        .select('*')
        .gte('draw_date', recentTime.toISOString())
        .order('draw_date', { ascending: false })
        .limit(1)
        .single()

      if (recentWinner && recentWinner.id !== lastCheckedWinner && !isInPostDrawPeriod) {
        console.log('🎉 Nouveau tirage détecté !', recentWinner)
        
        // 🔧 NOUVEAU : Vérifier si ce tirage est encore dans la période d'affichage (5 minutes)
        const drawTime = new Date(recentWinner.draw_date).getTime()
        const now = Date.now()
        const timeSinceDraw = now - drawTime
        const fiveMinutes = 5 * 60 * 1000
        
        if (timeSinceDraw > fiveMinutes) {
          console.log('⏰ Tirage trop ancien (plus de 5 minutes), ignoré')
          return
        }
        
        const { data: historicalParticipants } = await supabase
          .from('participants_history')
          .select('*')
          .eq('draw_id', recentWinner.id)

        if (historicalParticipants && historicalParticipants.length > 0) {
          console.log(`📊 Participants historiques récupérés: ${historicalParticipants.length}`)
          
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

          // 🔧 CORRECTION : Calculer le temps restant basé sur l'heure du tirage
          const timeForAnimation = 10 * 1000 // 10 secondes
          const timeElapsed = timeSinceDraw
          
          if (timeElapsed < timeForAnimation) {
            // 🔧 Animation en cours ou pas encore finie
            console.log(`🎲 Animation en cours (${Math.round((timeForAnimation - timeElapsed) / 1000)}s restantes)`)
            setIsSpinning(true)
            setWaitingForDraw(false)
            
            setTimeout(() => {
              console.log('🏆 Animation terminée, affichage du gagnant')
              setWinner(winnerData)
              setIsSpinning(false)
              setShowWinnerMessage(true)
              setIsSaved(true)
              setIsInPostDrawPeriod(true)
              setLastCheckedWinner(recentWinner.id)

              // Sauvegarder l'état avec le timestamp exact du tirage
              savePostDrawState(historicalParticipants.map(p => ({
                id: p.id,
                pseudoinstagram: p.pseudoinstagram,
                npa: p.npa,
                created_at: p.created_at
              })), winnerData, recentWinner.draw_date)

              // Nettoyer après le temps restant
              const remainingDisplayTime = fiveMinutes - timeSinceDraw
              setTimeout(() => {
                console.log('🧹 Nettoyage de l\'état post-tirage')
                clearPostDrawState()
              }, remainingDisplayTime)
            }, timeForAnimation - timeElapsed)
            
          } else {
            // 🔧 Animation terminée, afficher directement le gagnant
            console.log('🏆 Affichage direct du gagnant (animation déjà terminée)')
            setWinner(winnerData)
            setIsSpinning(false)
            setShowWinnerMessage(true)
            setIsSaved(true)
            setIsInPostDrawPeriod(true)
            setLastCheckedWinner(recentWinner.id)
            setWaitingForDraw(false)

            // Mettre à jour la liste des gagnants précédents
            setPreviousWinners(prev => {
              if (!prev.includes(recentWinner.pseudoinstagram)) {
                return [...prev, recentWinner.pseudoinstagram]
              }
              return prev
            })

            // Sauvegarder l'état avec le timestamp exact du tirage
            savePostDrawState(historicalParticipants.map(p => ({
              id: p.id,
              pseudoinstagram: p.pseudoinstagram,
              npa: p.npa,
              created_at: p.created_at
            })), winnerData, recentWinner.draw_date)

            // Nettoyer après le temps restant
            const remainingDisplayTime = fiveMinutes - timeSinceDraw
            if (remainingDisplayTime > 0) {
              setTimeout(() => {
                console.log('🧹 Nettoyage de l\'état post-tirage')
                clearPostDrawState()
              }, remainingDisplayTime)
            } else {
              // Le temps d'affichage est déjà écoulé
              clearPostDrawState()
            }
          }
        } else {
          console.log('⚠️ Aucun participant historique trouvé pour ce tirage')
        }
      }
    } catch (error) {
      // Pas de nouveau tirage trouvé, c'est normal
      if (error instanceof Error && !error.message.includes('PGRST116')) {
        console.error('❌ Erreur lors de la vérification de nouveau tirage:', error)
      }
    }
  }

  // 🔧 CORRIGÉ : Fonction appelée quand le décompte arrive à zéro (NE déclenche PLUS d'animation automatique)
  const handleCountdownComplete = () => {
    console.log('⏰ Décompte terminé ! Vérification s\'il y a un tirage...')
    setCountdownCompleted(true)
    
    // 🔧 CORRECTION MAJEURE : Ne PAS démarrer l'animation automatiquement
    // Seulement afficher qu'on attend le tirage et vérifier intensivement
    setWaitingForDraw(true)
    
    console.log('👀 Mode attente activé - recherche intensive de nouveau tirage...')
    
    // Vérifier immédiatement
    checkForNewDraw()
    
    // Puis vérifier intensivement toutes les 3 secondes pendant 10 minutes maximum
    const checkInterval = setInterval(async () => {
      console.log('🔍 Vérification intensive du nouveau tirage...')
      await checkForNewDraw()
    }, 3000)
    
    // Arrêter la vérification intensive après 10 minutes
    setTimeout(() => {
      console.log('⏰ Timeout : Arrêt de la vérification intensive après 10 minutes')
      clearInterval(checkInterval)
      setWaitingForDraw(false)
    }, 10 * 60 * 1000) // 10 minutes
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
        
        // Déclencher immédiatement la vérification de nouveau tirage
        setTimeout(() => {
          checkForNewDraw()
        }, 1000)
        
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

    // 🔧 AMÉLIORATION MAJEURE : Synchronisation plus fréquente pendant les heures de tirage
    const now = new Date()
    const isDrawTime = (now.getDay() === 0 || now.getDay() === 3) && now.getHours() >= 19 && now.getHours() <= 21
    
    // 🔧 NOUVEAU : Vérification très fréquente pendant les heures de tirage pour synchroniser tous les clients
    let interval: number
    if (isDrawTime || waitingForDraw) {
      interval = 2000 // 2 secondes pendant le tirage pour synchronisation parfaite
    } else if (isInPostDrawPeriod) {
      interval = 10000 // 10 secondes pendant l'affichage du gagnant
    } else {
      interval = 30000 // 30 secondes en temps normal
    }
    
    console.log(`🕐 Intervalle de vérification: ${interval/1000}s (isDrawTime: ${isDrawTime}, waitingForDraw: ${waitingForDraw}, isInPostDrawPeriod: ${isInPostDrawPeriod})`)
    
    const intervalId = setInterval(fetchData, interval)
    
    fetchData()

    return () => clearInterval(intervalId)
  }, [isInPostDrawPeriod, lastCheckedWinner, waitingForDraw])

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
                onComplete={handleCountdownComplete} // 🔧 CORRIGÉ : Plus d'animation automatique !
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
              disabled={isSpinning || waitingForDraw}
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
            {/* 🔧 NOUVEAU : Message d'attente du tirage après countdown */}
            {waitingForDraw && !isSpinning && !winner && (
              <div className="mb-6">
                <div className="bg-orange-500 text-white p-4 md:p-6 rounded-lg">
                  <h3 className="text-xl md:text-2xl mb-2">⏳ En attente du tirage...</h3>
                  <p className="text-lg md:text-xl">
                    Le tirage devrait commencer sous peu ! 
                    <br />
                    <span className="text-sm opacity-90">Vérification en cours...</span>
                  </p>
                </div>
              </div>
            )}

            {/* Animation en cours après détection d'un vrai tirage */}
            {isSpinning && !winner && (
              <div className="mb-6">
                <div className="bg-blue-500 text-white p-4 md:p-6 rounded-lg">
                  <h3 className="text-xl md:text-2xl mb-2">🎲 Tirage en cours...</h3>
                  <p className="text-lg md:text-xl">
                    Le gagnant va être révélé ! 
                  </p>
                </div>
              </div>
            )}

            {/* Message de félicitations */}
            {!isSpinning && winner && showWinnerMessage && (
              <div className="mb-6">
                <div className="bg-dollar-green text-white p-4 md:p-6 rounded-lg">
                  <h3 className="text-xl md:text-2xl mb-2">🎉 Félicitations !</h3>
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
          <div className="bg-gray-100 p-6 md:p-8 rounded-lg">
            <p className="text-lg md:text-xl text-gray-600">
              Aucun participant pour le moment. 
              <a href="/inscription" className="text-blue-600 hover:underline ml-1">
                Soyez le premier à vous inscrire !
              </a>
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
} 