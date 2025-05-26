declare module 'react-countdown'

declare module 'react-custom-roulette' {
  export interface WheelData {
    option: string
  }

  export interface WheelProps {
    mustStartSpinning: boolean
    prizeNumber: number
    data: WheelData[]
    backgroundColors?: string[]
    textColors?: string[]
    onStopSpinning: () => void
    startingOptionIndex?: number
    radiusLineWidth?: number
    perpendicularText?: boolean
    textDistance?: number
    fontSize?: number
    spinningDuration?: number
  }

  export const Wheel: React.FC<WheelProps>
} 