import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabaseClient'
import Countdown from 'react-countdown'
import { getNextDrawDate } from '@/utils/autoDrawing'

interface CountdownProps {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Home() {
  const [participantCount, setParticipantCount] = useState<number>(0)
  const montantGain = 20 // Montant en CHF
  
  useEffect(() => {
    const fetchParticipantCount = async () => {
      const { count } = await supabase
        .from('participants')
        .select('*', { count: 'exact' })
      
      setParticipantCount(count || 0)
    }

    fetchParticipantCount()
  }, [])

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center px-4">
        <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 md:mb-8">
          <img 
            src="/images/swisstimbo.jpg"
            alt="SwissTimbo"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">@SwissTimbo</h1>
        
        <div className="bg-dollar-green text-white p-4 md:p-8 rounded-lg mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl mb-3 md:mb-4">Gagnez {montantGain} CHF gratuitement !</h2>
          <p className="text-lg md:text-xl mb-4 md:mb-6">
            Participez à notre tirage au sort et tentez de gagner. 
            Il suffit d'être abonné pour y participer !
          </p>
          <p className="text-base md:text-lg bg-white/10 p-3 rounded">
            Tirages tous les mercredis et dimanches à 20h
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
          <div className="bg-light-gray p-4 md:p-6 rounded-lg">
            <h3 className="text-xl md:text-2xl font-bold mb-2">{participantCount}</h3>
            <p>Participants</p>
          </div>
          
          <div className="bg-light-gray p-4 md:p-6 rounded-lg">
            <h3 className="text-xl md:text-2xl font-bold mb-2">{montantGain} CHF</h3>
            <p>À gagner</p>
          </div>
          
          <div className="bg-light-gray p-4 md:p-6 rounded-lg">
            <h3 className="text-xl md:text-2xl font-bold mb-2">
              <Countdown 
                date={getNextDrawDate()}
                renderer={(props: CountdownProps) => (
                  <span>
                    {props.days > 0 && `${props.days}j `}
                    {props.hours}h {props.minutes}m {props.seconds}s
                  </span>
                )}
              />
            </h3>
            <p>Avant le prochain tirage</p>
          </div>
        </div>

        <a 
          href="/inscription" 
          className="inline-block bg-dollar-green text-white px-6 md:px-8 py-3 md:py-4 rounded-lg text-lg md:text-xl hover:bg-opacity-90 transition w-full md:w-auto mb-12"
        >
          Participer maintenant
        </a>

        <div className="mt-12 text-left">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Questions fréquentes</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
              <h3 className="text-lg md:text-xl font-bold mb-2">Comment participer ?</h3>
              <p>Il suffit d'être abonné à @SwissTimbo sur Instagram et de s'inscrire sur le site. C'est gratuit et sans engagement !</p>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
              <h3 className="text-lg md:text-xl font-bold mb-2">Quand ont lieu les tirages ?</h3>
              <p>Les tirages ont lieu tous les mercredis et dimanches à 20h précises.</p>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
              <h3 className="text-lg md:text-xl font-bold mb-2">Comment sont versés les gains ?</h3>
              <p>Les gains sont versés par Twint ou en cash via la Poste Suisse dans les 7 jours suivant le tirage.</p>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
              <h3 className="text-lg md:text-xl font-bold mb-2">Qui peut participer ?</h3>
              <p>Toute personne majeure (18 ans ou plus) et abonnée à @SwissTimbo peut participer.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 