import React, { useEffect, useState, useCallback } from 'react'
import { Crown } from 'lucide-react'
import { Participant } from '@/types'

interface PixelGridProps {
  participants: Participant[]
  previousWinners: string[]
  isSpinning: boolean
  winner: Participant | null
  onStopSpinning: () => void
}

const PixelGrid: React.FC<PixelGridProps> = ({
  participants,
  previousWinners,
  isSpinning,
  winner,
  onStopSpinning
}) => {
  const [columns, setColumns] = useState(3)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [clickedParticipantId, setClickedParticipantId] = useState<string | null>(null)

  // Utilisation de useCallback pour mémoriser la fonction
  const handleResize = useCallback(() => {
    if (window.innerWidth < 640) {
      setColumns(2)
    } else if (window.innerWidth < 1024) {
      setColumns(3)
    } else {
      setColumns(4)
    }
  }, [])

  // Gestion du redimensionnement
  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  // Animation du tirage avec cleanup approprié
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null

    if (isSpinning && participants.length > 0) {
      setShowWinnerAnimation(false)
      animationInterval = setInterval(() => {
        setHighlightedIndex(Math.floor(Math.random() * participants.length))
      }, 100)
    } else if (winner) {
      setHighlightedIndex(null)
      setShowWinnerAnimation(true)
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval)
      }
    }
  }, [isSpinning, participants.length, winner])

  // Fonction pour vérifier si un participant a déjà gagné
  const hasWonBefore = (pseudoinstagram: string) => {
    return previousWinners.includes(pseudoinstagram)
  }

  // Fonction pour gérer le clic sur un participant avec couronne
  const handleParticipantClick = (participant: Participant) => {
    // Afficher l'explication seulement si le participant a une couronne
    if (hasWonBefore(participant.pseudoinstagram)) {
      setClickedParticipantId(participant.id)
      setShowExplanation(true)
      
      // Faire disparaître l'explication après 2 secondes
      setTimeout(() => {
        setShowExplanation(false)
        setClickedParticipantId(null)
      }, 2000)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      {/* Explication centrée pour mobile uniquement */}
      {showExplanation && (
        <div className="block md:hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-yellow-50/90 backdrop-blur-sm border border-yellow-300/60 rounded-lg p-3 shadow-lg whitespace-nowrap">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
              <Crown size={14} className="text-yellow-500" />
              <span>Ancien gagnant</span>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`grid gap-2 md:gap-4`}
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className={`
              p-3 rounded-lg text-center transition-all duration-500 relative
              ${!isSpinning && winner?.id === participant.id 
                ? 'bg-dollar-green text-white scale-110 animate-winner-reveal shadow-lg' 
                : highlightedIndex === index 
                  ? 'bg-dollar-green text-white' 
                  : 'bg-gray-100'}
              ${showWinnerAnimation && winner?.id === participant.id 
                ? 'animate-winner-glow' 
                : ''}
              ${hasWonBefore(participant.pseudoinstagram) ? 'cursor-pointer hover:bg-gray-200' : ''}
            `}
            onClick={() => handleParticipantClick(participant)}
          >
            {/* Explication à côté du participant sur desktop uniquement */}
            {showExplanation && clickedParticipantId === participant.id && (
              <div className="hidden md:block absolute left-full top-1/2 transform -translate-y-1/2 ml-3 z-20">
                <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-300/60 rounded-lg p-2 shadow-lg whitespace-nowrap">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
                    <Crown size={14} className="text-yellow-500" />
                    <span>Ancien gagnant</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center space-x-1">
              {/* Afficher la couronne Lucide si le participant a déjà gagné ET que l'animation n'est pas en cours */}
              {!isSpinning && hasWonBefore(participant.pseudoinstagram) && (
                <Crown 
                  size={12} 
                  className="text-yellow-500 flex-shrink-0" 
                />
              )}
              <p className="text-sm md:text-base truncate">
                {participant.pseudoinstagram}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PixelGrid 