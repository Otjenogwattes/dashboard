import { useBackend, useLive } from './context';

export function useProfiles() {
  const backend = useBackend();
  const profiles = useLive(['profiles'], b => b.listProfiles());
  const list = profiles.data ?? [];
  const me = list.find(p => p.id === backend.userId) ?? null;
  const partner = list.find(p => p.id !== backend.userId) ?? null;
  return { me, partner, partnerName: partner?.name || 'Nikki', loading: profiles.loading, reload: profiles.reload };
}
