import React, { useEffect, useState } from 'react'
import { Participant } from '@/types'

interface PixelGridProps {
  participants: Participant[]
  isSpinning: boolean
  winner: Participant | null
  onStopSpinning: () => void
}

const PixelGrid: React.FC<PixelGridProps> = ({
  participants,
  isSpinning,
  winner,
  onStopSpinning
}) => {
  const [columns, setColumns] = useState(3)
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [showWinnerAnimation, setShowWinnerAnimation] = useState(false)

  // Ajuster le nombre de colonnes selon la largeur d'écran
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) { // Mobile
        setColumns(2)
      } else if (window.innerWidth < 1024) { // Tablet
        setColumns(3)
      } else { // Desktop
        setColumns(4)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Animation pendant le tirage
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSpinning) {
      setShowWinnerAnimation(false)
      interval = setInterval(() => {
        setHighlightedIndex(Math.floor(Math.random() * participants.length))
      }, 100) // Change de pseudo toutes les 100ms
    } else if (winner) {
      setHighlightedIndex(null)
      setShowWinnerAnimation(true)
    }
    return () => clearInterval(interval)
  }, [isSpinning, participants.length, winner])

  return (
    <div className="max-w-4xl mx-auto p-4">
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
              p-3 rounded-lg text-center transition-all duration-500
              ${!isSpinning && winner?.id === participant.id 
                ? 'bg-dollar-green text-white scale-110 animate-winner-reveal shadow-lg' 
                : highlightedIndex === index 
                  ? 'bg-dollar-green text-white' 
                  : 'bg-gray-100'}
              ${showWinnerAnimation && winner?.id === participant.id 
                ? 'animate-winner-glow' 
                : ''}
            `}
          >
            <p className="text-sm md:text-base truncate">
              {participant.pseudoinstagram}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PixelGrid 