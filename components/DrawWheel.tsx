import React from 'react'
import { Wheel } from 'react-custom-roulette'
import { Participant } from '@/types'

interface DrawWheelProps {
  participants: Participant[]
  isSpinning: boolean
  winner: Participant | null
  onStopSpinning: () => void
}

const DrawWheel: React.FC<DrawWheelProps> = ({
  participants,
  isSpinning,
  winner,
  onStopSpinning
}) => {
  const wheelData = participants.map((participant) => ({
    option: participant.pseudoinstagram
  }))

  return (
    <div className="max-w-md mx-auto">
      <Wheel
        mustStartSpinning={isSpinning}
        prizeNumber={winner ? participants.indexOf(winner) : 0}
        data={wheelData}
        backgroundColors={['#bc0b0b', '#D9D9D9']}
        textColors={['#FFFFFF']}
        onStopSpinning={onStopSpinning}
        spinDuration={0.8}
        startingOptionIndex={0}
        radiusLineWidth={1}
        perpendicularText={false}
        textDistance={60}
        fontSize={16}
        spinningDuration={5}
      />
    </div>
  )
}

export default DrawWheel 