import * as Sentry from "@sentry/nextjs";

// Sentry est désactivé si NEXT_PUBLIC_SENTRY_DSN n'est pas défini
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,       // 10% des transactions tracées
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    environment: process.env.NODE_ENV,
    // Ne jamais envoyer de données personnelles dans les événements
    beforeSend(event) {
      // Supprimer les URLs qui pourraient contenir des tokens
      if (event.request?.url) {
        event.request.url = event.request.url.split("?")[0];
      }
      return event;
    },
  });
}
