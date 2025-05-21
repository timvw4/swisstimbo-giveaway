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
  }

  export const Wheel: React.FC<WheelProps>
} 