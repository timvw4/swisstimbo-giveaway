import React from 'react'
import Layout from '@/components/Layout'

export default function About() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">À propos</h1>
        
        <div className="space-y-6 md:space-y-8">
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Qui sommes-nous ?</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                @SwissTimbo est une initiative suisse visant à créer une communauté 
                Instagram positive et engagée. Notre objectif est de récompenser 
                régulièrement nos abonnés fidèles à travers des tirages au sort 
                transparents et équitables.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Notre mission</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                Dans un monde où les réseaux sociaux sont souvent critiqués, nous avons 
                décidé de créer une communauté bienveillante où chacun peut avoir une 
                chance de gagner. Nos tirages au sort réguliers sont notre façon de 
                remercier notre communauté pour sa fidélité.
              </p>
              <p className="mb-4">
                Nous croyons en la transparence et l'équité. C'est pourquoi tous nos 
                tirages sont effectués en direct et de manière totalement aléatoire, 
                donnant à chaque participant une chance égale de gagner.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Nos valeurs</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                • Transparence dans tous nos tirages au sort<br />
                • Équité pour tous les participants<br />
                • Engagement envers notre communauté<br />
                • Fiabilité dans nos versements de gains
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
} 