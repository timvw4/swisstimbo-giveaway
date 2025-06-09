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
  lastProcessedWinnerId: string // ID du dernier gagnant traité pour éviter les re-animations
  drawTimestamp: number // 🔧 NOUVEAU : timestamp exact du tirage pour synchronisation
  animationCompleted: boolean // 🔧 NOUVEAU : éviter re-animation au changement de page
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
  const [waitingForDraw, setWaitingForDraw] = useState(false)
  // 🔧 NOUVEAU : État pour la subscription Realtime
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null)
  // 🔧 NOUVEAU : Sauvegarder les participants avant le tirage pour l'animation
  const [participantsAtDrawTime, setParticipantsAtDrawTime] = useState<Participant[]>([])
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
            console.log(`🎬 Animation déjà terminée: ${state.animationCompleted}`)
            
            setFrozenParticipants(state.frozenParticipants)
            setWinner(state.winner)
            setIsInPostDrawPeriod(true)
            setIsSaved(true)
            setShowWinnerMessage(true)
            setLastCheckedWinner(state.lastProcessedWinnerId || state.winner.id)
            
            // 🔧 NOUVEAU : NE PAS relancer d'animation si déjà terminée
            if (state.animationCompleted) {
              setIsSpinning(false)
              setWaitingForDraw(false)
              console.log('✅ Animation déjà terminée, affichage direct du gagnant')
            } else {
              // Animation peut encore être en cours, calculer le temps restant
              const animationEndTime = state.drawTimestamp + 10000 // 10 secondes d'animation
              const remainingAnimation = animationEndTime - now
              
              if (remainingAnimation > 0) {
                console.log(`🎲 Animation en cours, temps restant: ${Math.round(remainingAnimation / 1000)}s`)
                setIsSpinning(true)
                setTimeout(() => {
                  console.log('🏆 Animation terminée (synchronisation)')
                  setIsSpinning(false)
                  // Marquer comme terminée
                  const updatedState = { ...state, animationCompleted: true }
                  localStorage.setItem('postDrawState', JSON.stringify(updatedState))
                }, remainingAnimation)
              } else {
                console.log('⏰ Animation devrait être terminée, affichage direct')
                setIsSpinning(false)
                // Marquer comme terminée
                const updatedState = { ...state, animationCompleted: true }
                localStorage.setItem('postDrawState', JSON.stringify(updatedState))
              }
            }
            
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

  // 🔧 NOUVEAU : Setup de la subscription Realtime
  useEffect(() => {
    console.log('🚀 Initialisation de la subscription Realtime pour les tirages...')
    
    const subscription = supabase
      .channel('winners-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'winners'
        },
        (payload) => {
          console.log('🎉 NOUVEAU TIRAGE DÉTECTÉ EN TEMPS RÉEL !', payload.new)
          
          // Traiter immédiatement le nouveau tirage
          handleRealtimeWinner(payload.new)
        }
      )
      .subscribe((status) => {
        console.log('📡 Status subscription Realtime:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription active - Prêt pour les tirages en temps réel !')
        }
      })

    setRealtimeSubscription(subscription)

    // Cleanup de la subscription
    return () => {
      console.log('🔌 Fermeture de la subscription Realtime')
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // 🔧 NOUVEAU : Fonction pour traiter un gagnant en temps réel
  const handleRealtimeWinner = async (winnerData: any) => {
    console.log('⚡ Traitement temps réel du gagnant:', winnerData)
    
    // Vérifier si ce gagnant n'a pas déjà été traité
    if (winnerData.id === lastCheckedWinner || isInPostDrawPeriod) {
      console.log('🔄 Gagnant déjà traité ou en période post-tirage, ignoré')
      return
    }
    
    // Vérifier si le tirage est récent (moins de 5 minutes)
    const drawTime = new Date(winnerData.draw_date).getTime()
    const now = Date.now()
    const timeSinceDraw = now - drawTime
    const fiveMinutes = 5 * 60 * 1000
    
    console.log(`⏰ Tirage: ${new Date(drawTime).toLocaleTimeString()}`)
    console.log(`⏰ Maintenant: ${new Date(now).toLocaleTimeString()}`)
    console.log(`⌛ Temps écoulé: ${Math.round(timeSinceDraw / 1000)}s`)
    
    if (timeSinceDraw > fiveMinutes) {
      console.log('⏰ Tirage trop ancien (plus de 5 minutes), ignoré')
      return
    }
    
    console.log('✅ Tirage récent, utilisation des participants sauvegardés...')
    
    // 🔧 SOLUTION PARFAITE : Utiliser les participants sauvegardés au moment du tirage
    const allParticipants = participantsAtDrawTime.length > 0 ? participantsAtDrawTime : participants
    
    if (allParticipants && allParticipants.length > 0) {
      console.log(`📊 Participants pour l'animation: ${allParticipants.length}`)
      console.log('👥 Participants:', allParticipants.map(p => p.pseudoinstagram))
      
      // Utiliser tous les participants pour l'animation
      setFrozenParticipants([...allParticipants])

      // Créer l'objet gagnant
      const winner = {
        id: winnerData.participant_id,
        pseudoinstagram: winnerData.pseudoinstagram,
        npa: '', // On n'a pas le NPA dans la table winners
        created_at: winnerData.draw_date
      }

      // 🔧 AMÉLIORATION : Synchronisation PARFAITE basée sur l'heure du tirage
      const animationDuration = 10000 // 10 secondes FIXE
      const animationEndTime = drawTime + animationDuration
      const remainingAnimation = animationEndTime - now
      
      console.log(`🎬 Synchronisation parfaite:`)
      console.log(`  - Fin théorique: ${new Date(animationEndTime).toLocaleTimeString()}`)
      console.log(`  - Temps restant: ${Math.round(remainingAnimation / 1000)}s`)
      
      let finalAnimationTime
      if (remainingAnimation > 1000) {
        // Animation encore en cours
        finalAnimationTime = remainingAnimation
        console.log(`🎲 SYNCHRONISATION PARFAITE - ${Math.round(finalAnimationTime / 1000)}s restantes`)
      } else {
        // Animation devrait être terminée, affichage direct
        finalAnimationTime = 0
        console.log(`🏆 Animation devrait être terminée, affichage direct du gagnant`)
      }
      
      setIsSpinning(finalAnimationTime > 0)
      setWaitingForDraw(false)
      setLastCheckedWinner(winnerData.id)
      
      if (finalAnimationTime > 0) {
        // Lancer l'animation synchronisée
        setTimeout(() => {
          console.log('🏆 ANIMATION TERMINÉE - Affichage du gagnant (Realtime)')
          completeDrawAnimation(winner, allParticipants, winnerData.draw_date, drawTime)
        }, finalAnimationTime)
      } else {
        // Affichage direct
        completeDrawAnimation(winner, allParticipants, winnerData.draw_date, drawTime)
      }
    } else {
      console.log('❌ Aucun participant trouvé pour l\'animation')
    }
  }

  // 🔧 NOUVEAU : Fonction commune pour terminer l'animation
  const completeDrawAnimation = (winner: Participant, participants: any[], drawDate: string, drawTimestamp: number) => {
    setWinner(winner)
    setIsSpinning(false)
    setShowWinnerMessage(true)
    setIsSaved(true)
    setIsInPostDrawPeriod(true)

    // Sauvegarder l'état avec animation terminée
    savePostDrawState(participants.map(p => ({
      id: p.id,
      pseudoinstagram: p.pseudoinstagram,
      npa: p.npa,
      created_at: p.created_at
    })), winner, drawDate, drawTimestamp, true)

    // Programmer le nettoyage
    const fiveMinutesFromDraw = drawTimestamp + (5 * 60 * 1000)
    const remainingDisplayTime = fiveMinutesFromDraw - Date.now()
    
    console.log(`🧹 Nettoyage programmé dans ${Math.round(remainingDisplayTime / 1000)}s`)
    
    if (remainingDisplayTime > 0) {
      setTimeout(() => {
        console.log('🧹 Nettoyage automatique de l\'état post-tirage')
        clearPostDrawState()
      }, remainingDisplayTime)
    }
  }

  // 🔧 AMÉLIORÉ : Fonction pour sauvegarder l'état post-tirage
  const savePostDrawState = (participants: Participant[], winner: Participant, drawDate: string, drawTimestamp?: number, animationCompleted: boolean = false) => {
    if (typeof window !== 'undefined') {
      const timestamp = drawTimestamp || new Date(drawDate).getTime()
      const endTime = timestamp + (5 * 60 * 1000) // 5 minutes à partir du tirage
      const state: PostDrawState = {
        frozenParticipants: participants,
        winner,
        endTime,
        lastProcessedWinnerId: winner.id,
        drawTimestamp: timestamp,
        animationCompleted
      }
      localStorage.setItem('postDrawState', JSON.stringify(state))
      console.log('💾 État post-tirage sauvegardé avec animation:', animationCompleted)
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
    // 🔧 NOUVEAU : Réinitialiser aussi la sauvegarde des participants
    setParticipantsAtDrawTime([])
  }

  // 🔧 CORRIGÉ : Fonction appelée quand le décompte arrive à zéro
  const handleCountdownComplete = () => {
    console.log('⏰ COUNTDOWN TERMINÉ ! Activation du mode vérification...')
    setCountdownCompleted(true)
    setWaitingForDraw(true)
    
    // 🔧 NOUVEAU : Sauvegarder les participants actuels pour l'animation
    console.log(`🎬 Sauvegarde des participants pour l'animation: ${participants.length}`)
    setParticipantsAtDrawTime([...participants])
    
    console.log('🚀 Mode attente activé - Les tirages seront détectés en temps réel via Realtime !')
    
    // 🔧 NOUVEAU : Arrêter l'attente après 10 minutes si aucun tirage n'est détecté
    setTimeout(() => {
      if (waitingForDraw && !winner && !isInPostDrawPeriod) {
        console.log('⏰ Timeout : Arrêt de la vérification après 10 minutes')
        setWaitingForDraw(false)
      }
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

    // 🔧 NOUVEAU : Sauvegarder les participants avant le test
    console.log(`🎬 Sauvegarde des participants pour le test: ${participants.length}`)
    setParticipantsAtDrawTime([...participants])

    setWaitingForDraw(true)
    console.log('🚀 Activation mode attente pour le test...')

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
        console.log('📡 Le tirage sera détecté automatiquement via Realtime...')
        
        // Realtime va détecter le nouveau tirage automatiquement
        // Pas besoin d'action supplémentaire
        
      } else {
        console.error('🧪 TEST : Erreur tirage automatique:', result.error)
        alert(`Erreur: ${result.error}`)
        setWaitingForDraw(false)
      }
    } catch (error) {
      console.error('🧪 TEST : Erreur API:', error)
      alert('Erreur lors de l\'appel API')
      setWaitingForDraw(false)
    }
  }

  // 🔧 SIMPLIFIÉ : useEffect pour les données de base (sans polling intensif)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
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
    
    // Chargement initial
    fetchInitialData()
    
    // 🔧 SIMPLIFIÉ : Mise à jour moins fréquente car Realtime gère les tirages
    const interval = setInterval(fetchInitialData, isInPostDrawPeriod ? 10000 : 30000)
    
    return () => clearInterval(interval)
  }, [isInPostDrawPeriod])

  const displayedParticipants = (isInPostDrawPeriod || isSpinning) ? frozenParticipants : participants

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
            {/* 🔧 NOUVEAU : Indicateur de status Realtime */}
            <div className="mt-3 text-sm">
              <span className="text-green-600">📡 Realtime: 
                {realtimeSubscription ? ' ✅ Connecté' : ' ⏳ Connexion...'}
              </span>
            </div>
          </div>
        )}

        {isClient && displayedParticipants.length > 0 ? (
          <div className="mb-6 md:mb-8">
            {/* 🔧 AMÉLIORÉ : Message d'attente du tirage après countdown */}
            {waitingForDraw && !isSpinning && !winner && (
              <div className="mb-6">
                <div className="bg-orange-500 text-white p-4 md:p-6 rounded-lg">
                  <h3 className="text-xl md:text-2xl mb-2">⏳ En attente du tirage...</h3>
                  <p className="text-lg md:text-xl">
                    Le tirage sera détecté instantanément ! 
                    <br />
                    <span className="text-sm opacity-90">📡 Synchronisation temps réel active</span>
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
                    <br />
                    <span className="text-sm opacity-90">🔄 Synchronisé avec tous les utilisateurs</span>
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