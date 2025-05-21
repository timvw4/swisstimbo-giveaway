import React from 'react'
import Layout from '@/components/Layout'

export default function Reglement() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-center">Règlement du concours</h1>
        
        <div className="space-y-6 md:space-y-8">
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 1 - Conditions de participation</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Le participant doit être majeur (18 ans ou plus)</li>
              <li>Le participant doit être abonné au compte Instagram @Jacques_reverdin</li>
              <li>Une seule participation par personne est autorisée</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 2 - Modalités du tirage</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Le tirage au sort a lieu tous les mardis et vendredis à 20h</li>
              <li>Le gagnant est sélectionné de manière aléatoire parmi tous les participants</li>
              <li>Le résultat du tirage est définitif et ne peut être contesté</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 3 - Gains</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Le montant du gain est fixé à 20 CHF</li>
              <li>Le gain sera versé au gagnant dans un délai de 7 jours</li>
              <li>Le gagnant sera contacté via Instagram pour les modalités de versement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 4 - Disqualification</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Toute tentative de fraude entraînera une disqualification immédiate</li>
              <li>Les comptes Instagram suspects ou factices seront disqualifiés</li>
              <li>Le désabonnement du compte @Jacques_reverdin entraîne la disqualification</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  )
} 