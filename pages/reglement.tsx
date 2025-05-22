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
              <li>Le participant doit être abonné au compte Instagram @SwissTimbo</li>
              <li>Une seule participation par personne est autorisée</li>
              <li>La participation est gratuite et sans obligation d'achat</li>
              <li>Les inscriptions sont fermées 5 minutes avant chaque tirage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 2 - Modalités du tirage</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Le tirage au sort a lieu tous les mercredis et dimanches à 20h précises</li>
              <li>Le gagnant est sélectionné de manière aléatoire parmi tous les participants inscrits</li>
              <li>Le résultat du tirage est définitif et ne peut être contesté</li>
              <li>Le tirage est effectué automatiquement par un système informatique</li>
              <li>Le résultat est annoncé immédiatement après le tirage sur le site et notre page Instagram</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 3 - Gains</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Le montant du gain est fixé à 20 CHF par tirage</li>
              <li>Le gain sera versé au gagnant dans un délai maximum de 7 jours ouvrables</li>
              <li>Le gagnant sera contacté via Instagram pour les modalités de versement</li>
              <li>Sans réponse du gagnant sous 48h, le gain sera remis en jeu</li>
              <li>Le versement sera effectué sur Twint ou en cash par la Poste Suisse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 4 - Disqualification</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Toute tentative de fraude entraînera une disqualification immédiate</li>
              <li>Les comptes Instagram suspects ou factices seront disqualifiés</li>
              <li>Le désabonnement du compte @SwissTimbo entraîne la disqualification</li>
              <li>L'utilisation de bots ou de scripts automatisés est interdite</li>
              <li>La fourniture de fausses informations entraîne la disqualification</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 5 - Protection des données</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>Les données personnelles sont collectées uniquement pour le tirage</li>
              <li>Les données ne sont pas partagées avec des tiers</li>
              <li>Les données sont supprimées après chaque tirage</li>
              <li>Conformément à la LPD, vous disposez d'un droit d'accès et de rectification</li>
              <li>Pour toute demande concernant vos données : @SwissTimbo sur Instagram</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Article 6 - Modifications</h2>
            <ul className="list-disc pl-4 md:pl-6 space-y-2 text-sm md:text-base">
              <li>L'organisateur se réserve le droit de modifier le règlement à tout moment</li>
              <li>Les modifications seront annoncées sur le compte Instagram @SwissTimbo</li>
              <li>La participation implique l'acceptation pleine et entière du règlement</li>
              <li>En cas de litige, seule la version du règlement disponible sur le site fait foi</li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  )
} 