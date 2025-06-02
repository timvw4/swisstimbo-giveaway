import React from 'react'
import Countdown from 'react-countdown'
import { getNextDrawDate } from '@/utils/dateUtils'

interface CountdownRendererProps {
  days: number
  hours: number
  minutes: number
  seconds: number
  completed: boolean
}

const CountdownTimer: React.FC = () => {
  const renderer = ({ days, hours, minutes, seconds, completed }: CountdownRendererProps) => {
    if (completed) {
      return <span>Tirage en cours...</span>
    }

    return (
      <span>
        {days > 0 && `${days}j `}
        {hours.toString().padStart(2, '0')}h
        {minutes.toString().padStart(2, '0')}m
        {seconds.toString().padStart(2, '0')}s
      </span>
    )
  }

  return <Countdown date={getNextDrawDate()} renderer={renderer} />
}

export default CountdownTimer 