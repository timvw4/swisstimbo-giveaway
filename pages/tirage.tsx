import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'
import Countdown from 'react-countdown'
import { Participant } from '@/types'

// Import dynamique de la roue pour éviter l'erreur window
const Wheel = dynamic(
  () => import('react-custom-roulette').then((mod) => mod.Wheel),
  { ssr: false }
)

export default function Tirage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getNextDrawDate = () => {
    const now = new Date()
    const day = now.getDay()
    const hours = now.getHours()
    let nextDate = new Date()
    
    if (day < 2 || (day === 2 && hours < 20)) {
      nextDate.setDate(nextDate.getDate() + ((2 + 7 - day) % 7))
    } else if (day < 5 || (day === 5 && hours < 20)) {
      nextDate.setDate(nextDate.getDate() + ((5 + 7 - day) % 7))
    } else {
      nextDate.setDate(nextDate.getDate() + ((2 + 7 - day) % 7))
    }
    
    nextDate.setHours(20, 0, 0, 0)
    return nextDate
  }

  const performDraw = () => {
    if (participants.length > 0) {
      setIsSpinning(true)
      const winnerIndex = Math.floor(Math.random() * participants.length)
      setWinner(participants[winnerIndex])
      
      setTimeout(() => {
        setIsSpinning(false)
      }, 10000)
    }
  }

  // Gestionnaire de fin de compte à rebours
  const handleCountdownComplete = () => {
    performDraw()
  }

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('id, nom, age, pseudoinstagram, created_at')
        
        if (error) {
          console.error('Erreur lors de la récupération des participants:', error)
          return
        }

        if (data) {
          setParticipants(data)
        }
      } catch (err) {
        console.error('Erreur:', err)
      }
    }

    fetchParticipants()
  }, [])

  const wheelData = participants.map((participant) => ({
    option: participant.pseudoinstagram
  }))

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-8">Tirage au sort</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Prochain tirage dans :</h2>
          <div className="text-3xl font-bold">
            <Countdown 
              date={getNextDrawDate()} 
              onComplete={handleCountdownComplete}
            />
          </div>
        </div>

        {isClient && participants.length > 0 ? (
          <div className="mb-8">
            <div className="max-w-md mx-auto mb-8">
              <Wheel
                mustStartSpinning={isSpinning}
                prizeNumber={winner ? participants.indexOf(winner) : 0}
                data={wheelData}
                backgroundColors={['#00724E', '#D9D9D9']}
                textColors={['#FFFFFF']}
                onStopSpinning={() => {
                  setIsSpinning(false)
                }}
              />
            </div>
            
            {!isSpinning && winner && (
              <div className="bg-dollar-green text-white p-6 rounded-lg">
                <h3 className="text-2xl mb-2">Félicitations !</h3>
                <p className="text-xl">
                  Le gagnant est : <strong>{winner.pseudoinstagram}</strong>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xl">Aucun participant pour le moment</p>
        )}
      </div>
    </Layout>
  )
} 