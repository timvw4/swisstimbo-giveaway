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
  const [frozenParticipants, setFrozenParticipants] = useState<Participant[]>([]) // Liste figée pour affichage
  const [previousWinners, setPreviousWinners] = useState<string[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showWinnerMessage, setShowWinnerMessage] = useState(false)
  const [isInPostDrawPeriod, setIsInPostDrawPeriod] = useState(false) // Période de 5 minutes après tirage
  const router = useRouter()
  
  useEffect(() => {
    setIsClient(true)
    
    // Vérifier s'il y a un état post-tirage persisté au chargement de la page
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('postDrawState')
      if (savedState) {
        try {
          const state: PostDrawState = JSON.parse(savedState)
          const now = Date.now()
          
          // Vérifier si la période de 5 minutes n'est pas expirée
          if (now < state.endTime) {
            // Restaurer l'état
            setFrozenParticipants(state.frozenParticipants)
            setWinner(state.winner)
            setIsInPostDrawPeriod(true)
            setIsSaved(true)
            setShowWinnerMessage(true)
            
            // Programmer la fin de la période
            const remainingTime = state.endTime - now
            setTimeout(() => {
              clearPostDrawState()
            }, remainingTime)
          } else {
            // La période est expirée, nettoyer
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

  const saveWinner = async (winner: Participant) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 10000))

      // 1. Sauvegarder le gagnant
      const { data: winnerData, error: winnerError } = await supabase
        .from('winners')
        .insert([{
          participant_id: winner.id,
          pseudoinstagram: winner.pseudoinstagram,
          draw_date: new Date().toISOString(),
          montant: 20
        }])
        .select()
        .single()

      if (winnerError) throw winnerError

      // 2. Récupérer tous les participants pour l'historique
      const { data: allParticipants, error: fetchError } = await supabase
        .from('participants')
        .select('*')

      if (fetchError) throw fetchError

      // 3. Vérifier quels participants ne sont PAS encore dans l'historique
      if (allParticipants && winnerData) {
        // Récupérer tous les pseudos déjà présents dans l'historique
        const { data: existingHistory, error: historyFetchError } = await supabase
          .from('participants_history')
          .select('pseudoinstagram')

        if (historyFetchError) throw historyFetchError

        // Créer un Set des pseudos déjà présents pour une recherche rapide
        const existingPseudos = new Set(
          existingHistory?.map(entry => entry.pseudoinstagram) || []
        )

        // Filtrer pour ne garder que les nouveaux participants
        const newParticipants = allParticipants.filter(
          participant => !existingPseudos.has(participant.pseudoinstagram)
        )

        console.log(`Participants total: ${allParticipants.length}`)
        console.log(`Participants déjà dans l'historique: ${existingPseudos.size}`)
        console.log(`Nouveaux participants à ajouter: ${newParticipants.length}`)

        // Sauvegarder SEULEMENT les nouveaux participants dans l'historique
        if (newParticipants.length > 0) {
          const historyEntries = newParticipants.map(participant => ({
            pseudoinstagram: participant.pseudoinstagram,
            npa: participant.npa,
            created_at: participant.created_at,
            draw_date: winnerData.draw_date,
            draw_id: winnerData.id
          }))

          const { error: historyError } = await supabase
            .from('participants_history')
            .insert(historyEntries)

          if (historyError) throw historyError
          
          console.log(`${newParticipants.length} nouveaux participants ajoutés à l'historique`)
        } else {
          console.log('Aucun nouveau participant à ajouter (tous déjà présents dans l\'historique)')
        }
      }

      // 4. SUPPRIMER IMMÉDIATEMENT les participants de la base de données
      const { error: deleteError } = await supabase
        .from('participants')
        .delete()
        .not('id', 'is', null)

      if (deleteError) throw deleteError

      // 5. Figer la liste des participants pour l'affichage pendant 5 minutes
      setFrozenParticipants([...participants])
      setIsInPostDrawPeriod(true)
      setIsSaved(true)
      setShowWinnerMessage(true)
      
      // 6. Sauvegarder l'état dans localStorage
      savePostDrawState([...participants], winner)
      
      // Redirection après 5 secondes
      setTimeout(() => {
        router.push('/gagnants')
      }, 5000)
      
      // 7. Après 5 minutes : réinitialiser complètement la page tirage
      setTimeout(() => {
        clearPostDrawState()
      }, 5 * 60 * 1000) // 5 minutes en millisecondes

    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
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

  const performDraw = async () => {
    if (participants.length > 0) {
      setIsSpinning(true)
      
      try {
        // Appeler l'API pour le tirage centralisé
        const response = await fetch('/api/perform-draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const data = await response.json()
        
        if (data.success) {
          setWinner(data.winner)
          
          // 🔧 NOUVEAU : Mettre à jour immédiatement la liste des anciens gagnants
          setPreviousWinners(prev => [...prev, data.winner.pseudoinstagram])
          
          setTimeout(() => {
            setIsSpinning(false)
            setShowWinnerMessage(true)
            setIsSaved(true)
            
            // Redirection après 5 secondes
            setTimeout(() => {
              router.push('/gagnants')
            }, 5000)
          }, 10000)
        }
      } catch (error) {
        console.error('Erreur lors du tirage:', error)
        setIsSpinning(false)
      }
    }
  }

  const handleCountdownComplete = () => {
    performDraw()
  }

  useEffect(() => {
    const fetchData = async () => {
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
          // Extraire uniquement les pseudos des gagnants précédents
          const winnerPseudos = winnersData.map(winner => winner.pseudoinstagram)
          setPreviousWinners(winnerPseudos)
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchData, 30000)
    fetchData() // Première exécution

    return () => clearInterval(interval) // Nettoyage à la destruction du composant
  }, [isInPostDrawPeriod]) // Dépendance sur isInPostDrawPeriod

  // Déterminer quels participants afficher
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

        {isClient && displayedParticipants.length > 0 ? (
          <div className="mb-6 md:mb-8">
            {/* Message de félicitations - affiché AU-DESSUS de la grille pendant 5 minutes */}
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

            {/* Grille des participants (figée ou en temps réel selon la période) */}
            <PixelGrid
              participants={displayedParticipants}
              previousWinners={previousWinners}
              isSpinning={isSpinning}
              winner={winner}
              onStopSpinning={() => setIsSpinning(false)}
            />
            
            {/* Message de réinitialisation - affiché EN DESSOUS de la grille pendant 5 minutes */}
            {!isSpinning && winner && isSaved && (
              <div className="mt-6">
                <div className="bg-blue-100 text-blue-800 p-4 rounded-lg">
                  <p className="text-lg">
                    Le tirage est terminé ! Les participants seront réinitialisés dans 5 minutes.
                    <br />
                    Redirection vers la page des gagnants dans quelques secondes...
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