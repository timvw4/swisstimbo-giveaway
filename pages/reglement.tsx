import React from 'react'
import Layout from '@/components/Layout'

export default function Reglement() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">
          Règlement du tirage au sort
        </h1>

        <div className="space-y-6 text-gray-700">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Conditions de participation</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Être majeur (18 ans ou plus)</li>
              <li>Être abonné au compte Instagram @swiss.timbo</li>
              <li>Résider en Suisse (code postal suisse valide)</li>
              <li>Une seule participation par personne par tirage</li>
              <li>Limite de 1000 participants par tirage</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Déroulement du tirage</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Les tirages ont lieu tous les mercredis et dimanches à 20h précises</li>
              <li>Les inscriptions se ferment automatiquement 5 minutes avant le tirage</li>
              <li>Le gagnant est sélectionné de manière totalement aléatoire</li>
              <li>Le résultat est immédiatement affiché sur le site</li>
              <li>La liste des participants est réinitialisée après chaque tirage</li>
              <li>Lorsque la limite de 1000 participants est atteinte, les inscriptions sont automatiquement fermées jusqu'au prochain tirage</li>
            </ul>
          </section>

          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Gains et versement</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Le montant du gain est de 20 CHF par tirage</li>
              <li>Le versement est effectué par Twint ou en cash via la Poste Suisse</li>
              <li>Le délai de versement est de 7 jours maximum après le tirage</li>
              <li>Le gagnant sera contacté via Instagram pour les modalités de versement</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  )
} 