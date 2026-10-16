import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/** Laat zien dat je offline bent; de app toont dan de laatst bekende gegevens. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <p className="offline" role="status">
      Offline. Je ziet de laatst bekende gegevens; wat je nu afvinkt of telt, wordt mogelijk niet opgeslagen.
    </p>
  );
}
