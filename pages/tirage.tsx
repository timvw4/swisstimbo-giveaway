import React, { useEffect, useState, useCallback, useRef } from 'react'
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
  // 🔧 NOUVEAU : Détection mobile et fallback
  const [isMobile, setIsMobile] = useState(false)
  const [lastCheckedWinnerTime, setLastCheckedWinnerTime] = useState<number>(Date.now())
  
  // 🎯 NOUVEAU : Configuration pour gain spécial (doit correspondre à l'API et index.tsx)
  const GAIN_SPECIAL = {
    actif: true, // ✨ Mettre à false pour revenir au gain normal
    montant: 40, // 💰 Montant du gain spécial
    description: "🎉 TIRAGE SPÉCIAL - GAIN DOUBLÉ !"
  }
  
  // 🔧 NOUVEAU : Refs pour accéder aux valeurs actuelles sans dépendances circulaires
  const participantsRef = useRef<Participant[]>([])
  const participantsAtDrawTimeRef = useRef<Participant[]>([])
  
  // 🔧 NOUVEAU : Mettre à jour les refs quand les states changent
  useEffect(() => {
    participantsRef.current = participants
  }, [participants])
  
  useEffect(() => {
    participantsAtDrawTimeRef.current = participantsAtDrawTime
  }, [participantsAtDrawTime])
  
  const router = useRouter()
  
  useEffect(() => {
    setIsClient(true)
    
    // 🔧 NOUVEAU : Détecter si on est sur mobile
    const userAgent = navigator.userAgent
    const mobileDetected = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    setIsMobile(mobileDetected)
    console.log('📱 Appareil détecté:', mobileDetected ? 'Mobile' : 'Desktop')
    
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

  // 🔧 NOUVEAU : Fonction pour traiter un gagnant en temps réel avec useCallback
  const handleRealtimeWinner = useCallback(async (winnerData: any) => {
    console.log('⚡ Traitement temps réel du gagnant:', winnerData.pseudoinstagram)
    
    // Vérifier si ce gagnant n'a pas déjà été traité
    if (winnerData.id === lastCheckedWinner || isInPostDrawPeriod) {
      console.log('🔄 Gagnant déjà traité, ignoré')
      return
    }
    
    console.log('✅ Nouveau tirage détecté, préparation de l\'animation...')
    
    // 🔧 SOLUTION AVEC REFS : Utiliser les valeurs actuelles via les refs
    const currentParticipants = participantsRef.current
    const currentParticipantsAtDrawTime = participantsAtDrawTimeRef.current
    
    console.log(`🔍 Participants actuels: ${currentParticipants.length}`)
    console.log(`🔍 Participants sauvegardés: ${currentParticipantsAtDrawTime.length}`)
    
    const allParticipants = currentParticipantsAtDrawTime.length > 0 ? currentParticipantsAtDrawTime : currentParticipants
    
    if (allParticipants && allParticipants.length > 0) {
      console.log(`📊 Animation avec ${allParticipants.length} participants`)
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

      // 🔧 SIMPLIFIÉ : Toujours faire une animation de 8 secondes
      const animationTime = 8000 // 8 secondes d'animation TOUJOURS
      
      console.log(`🎬 LANCEMENT ANIMATION - 8 secondes`)
      
      setIsSpinning(true)
      setWaitingForDraw(false)
      setLastCheckedWinner(winnerData.id)
      
      // Lancer l'animation
      setTimeout(() => {
        console.log('🏆 ANIMATION TERMINÉE - Affichage du gagnant')
        const drawTime = new Date(winnerData.draw_date).getTime()
        completeDrawAnimation(winner, allParticipants, winnerData.draw_date, drawTime)
      }, animationTime)
      
    } else {
      console.log('❌ Aucun participant pour l\'animation')
      console.log('❌ Debug participants actuels:', currentParticipants.length)
      console.log('❌ Debug participants sauvegardés:', currentParticipantsAtDrawTime.length)
    }
  }, [lastCheckedWinner, isInPostDrawPeriod]) // 🔧 RÉDUIT : Seulement les dépendances essentielles

  // 🔧 NOUVEAU : Fonction commune pour terminer l'animation
  const completeDrawAnimation = (winner: Participant, participants: any[], drawDate: string, drawTimestamp: number) => {
    console.log('🏆 DÉBUT completeDrawAnimation')
    console.log('🏆 Winner:', winner.pseudoinstagram)
    console.log('🏆 Participants count:', participants.length)
    
    setWinner(winner)
    setIsSpinning(false)
    setShowWinnerMessage(true)
    setIsSaved(true)
    setIsInPostDrawPeriod(true)

    console.log('🏆 États mis à jour')

    // Sauvegarder l'état avec animation terminée
    const mappedParticipants = participants.map(p => ({
      id: p.id,
      pseudoinstagram: p.pseudoinstagram,
      npa: p.npa,
      created_at: p.created_at
    }))
    
    try {
      savePostDrawState(mappedParticipants, winner, drawDate, drawTimestamp, true)
      console.log('🏆 ✅ État sauvegardé avec succès')
    } catch (error) {
      console.error('🏆 ❌ Erreur sauvegarde état:', error)
    }

    // 🔧 SIMPLIFIÉ : Programmer le nettoyage dans 5 minutes fixes
    console.log('🧹 Nettoyage programmé dans 5 minutes')
    
    setTimeout(() => {
      console.log('🧹 Nettoyage automatique de l\'état post-tirage')
      clearPostDrawState()
    }, 5 * 60 * 1000) // 5 minutes fixes
    
    console.log('🏆 FIN completeDrawAnimation')
  }

  // 🔧 AMÉLIORÉ : Fonction pour sauvegarder l'état post-tirage
  const savePostDrawState = (participants: Participant[], winner: Participant, drawDate: string, drawTimestamp?: number, animationCompleted: boolean = false) => {
    console.log('💾 Sauvegarde état post-tirage')
    
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
      
      try {
        localStorage.setItem('postDrawState', JSON.stringify(state))
        console.log('💾 ✅ État sauvegardé avec succès')
      } catch (error) {
        console.error('💾 ❌ Erreur localStorage:', error)
      }
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

    // 🔧 NOUVEAU : Réinitialiser le timestamp pour le fallback mobile
    setLastCheckedWinnerTime(Date.now())

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
        console.log('📱 Fallback mobile actif:', isMobile)
        
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
    
    // 🔧 NOUVEAU : Fonction de fallback pour vérifier les nouveaux gagnants (mobile)
    const checkForNewWinners = async () => {
      if (!waitingForDraw || !isMobile) return
      
      try {
        const { data: recentWinners, error } = await supabase
          .from('winners')
          .select('*')
          .gte('draw_date', new Date(lastCheckedWinnerTime).toISOString())
          .order('draw_date', { ascending: false })
        
        if (error) {
          console.error('📱 ERREUR FALLBACK:', error)
          return
        }
        
        if (recentWinners && recentWinners.length > 0) {
          const latestWinner = recentWinners[0]
          console.log('📱 FALLBACK : Nouveau gagnant détecté !', latestWinner)
          handleRealtimeWinner(latestWinner)
          setLastCheckedWinnerTime(Date.now())
        }
      } catch (err) {
        console.error('📱 ERREUR FALLBACK:', err)
      }
    }
    
    // Chargement initial
    fetchInitialData()
    
    // 🔧 NOUVEAU : Polling pour mobile + mise à jour normale
    const normalInterval = setInterval(fetchInitialData, isInPostDrawPeriod ? 10000 : 30000)
    
    // 🔧 NOUVEAU : Polling fallback pour mobile uniquement (optimisé)
    const mobileInterval = isMobile && waitingForDraw 
      ? setInterval(checkForNewWinners, 5000) // Vérifie toutes les 5 secondes sur mobile (optimisé)
      : null
    
    return () => {
      clearInterval(normalInterval)
      if (mobileInterval) {
        clearInterval(mobileInterval)
      }
    }
  }, [isInPostDrawPeriod, isMobile, waitingForDraw, lastCheckedWinnerTime]) // 🔧 SUPPRIMÉ handleRealtimeWinner

  const displayedParticipants = (isInPostDrawPeriod || isSpinning) ? frozenParticipants : participants

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
  }, [handleRealtimeWinner]) // 🔧 CORRECTION : Dépendre seulement de la fonction

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8">Tirage au sort</h1>
        
        {/* 🎯 NOUVEAU : Affichage du gain spécial */}
        {GAIN_SPECIAL.actif && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 md:p-6 rounded-lg mb-6 md:mb-8 border-2 border-yellow-300 shadow-lg">
            <p className="text-xl md:text-2xl font-bold animate-pulse mb-2">
              {GAIN_SPECIAL.description}
            </p>
            <p className="text-lg md:text-xl font-semibold">
              🎁 {GAIN_SPECIAL.montant} CHF à gagner ce soir !
            </p>
            <p className="text-sm md:text-base opacity-90 mt-2">
              Montant exceptionnel pour ce tirage uniquement
            </p>
          </div>
        )}
        
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