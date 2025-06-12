import React from 'react'
import Layout from '@/components/Layout'

export default function About() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">À propos de SwissTimbo</h1>
            <div className="w-24 h-1 bg-dollar-green mx-auto rounded-full"></div>
          </div>
          
          <div className="space-y-8 md:space-y-12">
            <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-l-4 border-dollar-green">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-dollar-green rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">👥</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Qui sommes-nous ?</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">
                  SwissTimbo est né d'un simple constat : aujourd'hui, il est difficile de faire confiance sur internet. Trop de fausses promesses, trop d'arnaques.
                  <br /><br />
                  Alors on a décidé de faire l'inverse. Nous sommes un groupe d'amis, et on s'est lancé un défi un peu fou : créer la plus grande communauté francophone qui offre de l'argent et des cadeaux… gratuitement.
                  Pas de conditions cachées, pas de fausse promo, pas de ventes déguisées. Juste du vrai.
                  <br /><br />
                  Nous croyons vraiment en ce projet, et c'est pourquoi, pour l'instant, tout est financé de notre poche. À terme, nous espérons que des sponsors nous rejoindront pour nous permettre de vous offrir encore plus de cadeaux. 
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-r from-dollar-green to-red-600 rounded-2xl shadow-lg p-6 md:p-8 text-white">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">🎯</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Notre mission</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-white/90 leading-relaxed text-lg">
                Récompenser nos abonnés pour leur confiance, et leur redonner un peu de joie, sans rien leur demander en retour.<br />
                Actuellement, nos tirages sont ouverts à tous les Suisses : 100% gratuits, 100% équitables, 0% arnaque.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-l-4 border-yellow-400">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl font-bold">💛</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Nos valeurs</h2>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                Ce qu'on promet :
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-green-600 mr-3">✓</span>
                    <span className="text-gray-800">Pas de piège, pas d'arnaque</span>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-green-600 mr-3">✓</span>
                    <span className="text-gray-800">Aucune donnée revendue</span>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-green-600 mr-3">✓</span>
                    <span className="text-gray-800">Des tirages honnête et en direct</span>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-green-600 mr-3">✓</span>
                    <span className="text-gray-800">Une seule motivation : partager et faire plaisir</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-6">
                  <p className="text-gray-800 leading-relaxed text-lg">
                    SwissTimbo, c'est avant tout un projet qui nous fait kiffer et qui nous motive.<br />
                    Une idée simple, honnête, qui repose sur la confiance, la générosité… et un peu de chance.<br /><br />
                    <span className="text-2xl font-bold text-dollar-green">Bienvenue dans la team 💛</span>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  )
} 