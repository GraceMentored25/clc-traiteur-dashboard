export const metadata = { title: "Politique de confidentialité — C.LC. Traiteur" };

export default function ConfidentialitePage() {
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh] max-w-2xl">
      <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
        Politique de confidentialité
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-8">Dernière mise à jour : juin 2026</p>

      <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">1. Responsable du traitement</h2>
          <p>C.LC. Traiteur — Chez La Camerounaise. Les données sont traitées exclusivement dans le cadre de la gestion interne de l'activité de traiteur.</p>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">2. Données collectées</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Données clients</strong> : nom, numéro de téléphone, type d'événement, date</li>
            <li><strong>Données financières</strong> : montants des devis (HT, TTC, TVA)</li>
            <li><strong>Données opérationnelles</strong> : recettes, stocks, listes de courses</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">3. Finalités du traitement</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Établissement et suivi des devis</li>
            <li>Gestion comptable et financière</li>
            <li>Organisation des événements et logistique</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">4. Base légale</h2>
          <p>Exécution d'un contrat (devis/prestation) et intérêt légitime de gestion d'entreprise (article 6.1.b et 6.1.f du RGPD).</p>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">5. Durée de conservation</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Devis et données clients</strong> : 5 ans à compter de la création (obligations comptables légales)</li>
            <li><strong>Données opérationnelles</strong> (stocks, recettes) : durée de l'activité</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">6. Stockage et sécurité</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Données stockées sur Supabase (infrastructure chiffrée au repos)</li>
            <li>Accès protégé par authentification forte (mot de passe haché bcrypt + cookie HttpOnly)</li>
            <li>Transmission chiffrée HTTPS/TLS</li>
            <li>Sauvegardes locales chiffrées AES-256-GCM</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">7. Destinataires</h2>
          <p>Les données ne sont pas transmises à des tiers. Seul l'administrateur de C.LC. Traiteur y a accès.</p>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">8. Droits des personnes concernées (RGPD)</h2>
          <p className="mb-2">Conformément au RGPD, toute personne dont les données sont traitées dispose des droits suivants :</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Droit d'accès</strong> : obtenir une copie des données vous concernant</li>
            <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
            <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
            <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          </ul>
          <p className="mt-3">
            Pour exercer ces droits ou signaler un problème, contactez : <strong>contact@clctraiteur.fr</strong>
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            En cas de non-réponse dans un délai d'un mois, vous pouvez saisir la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline">www.cnil.fr</a>
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[var(--text-primary)] mb-2">9. Procédure de suppression (droit à l'effacement)</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Envoyez un email à contact@clctraiteur.fr avec l'objet "Suppression de mes données"</li>
            <li>Indiquez votre nom et la date approximative du devis concerné</li>
            <li>La suppression sera effectuée dans un délai de 30 jours</li>
            <li>Une confirmation vous sera envoyée par email</li>
          </ol>
        </section>

      </div>
    </div>
  );
}
