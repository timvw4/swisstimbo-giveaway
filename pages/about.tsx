import React from 'react'
import Layout from '@/components/Layout'

export default function About() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">À propos de SwissTimbo</h1>
        
        <div className="space-y-6 md:space-y-8">
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Qui sommes-nous ?</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
                SwissTimbo est né d’un simple constat : aujourd’hui, il est difficile de faire confiance sur internet. Trop de fausses promesses, trop d’arnaques.
                Alors on a décidé de faire l’inverse.<br />Nous sommes un groupe d’amis, et on s’est lancé un défi un peu fou : créer la plus grande communauté francophone qui offre de l’argent et des cadeaux… gratuitement.
                Pas de conditions cachées, pas de fausse promo, pas de ventes déguisées. Juste du vrai.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Notre mission</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
              Notre but est simple : récompenser nos abonnés pour leur confiance, et leur redonner un peu de joie — sans rien leur demander en retour.<br />
              On organise des tirages au sort ouverts à tous, 100% gratuits, équitables et transparents.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Nos valeurs</h2>
            <div className="prose max-w-none">
              <p className="mb-4">
              Ce qu’on promet :<br />

                • Pas de piège, aucne d’arnaque<br />
                • Aucune donnée revendue<br />
                • Des tirages filmés et clairs<br />
                • Une seule motivation : partager et faire plaisir<br /><br />

                SwissTimbo, c’est avant tout une aventure humaine.<br />
                Une idée simple, honnête, qui repose sur la confiance, la générosité… et un peu de chance.<br /><br />

                Bienvenue dans la team 💛
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
} 