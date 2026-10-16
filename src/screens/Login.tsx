import { useEffect, useState, type FormEvent } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import './login.css';

export function useSession(sb: SupabaseClient) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(s);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [sb]);

  return { session, loading, recovery, doneRecovering: () => setRecovery(false) };
}

function dutchError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'E-mail of wachtwoord klopt niet.';
  if (/email not confirmed/i.test(message)) return 'Dit account is nog niet bevestigd. Bevestig het in Supabase of via de mail.';
  if (/rate limit|too many/i.test(message)) return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
  if (/password should be at least/i.test(message)) return 'Kies een wachtwoord van minstens 8 tekens.';
  if (/fetch|network/i.test(message)) return 'Geen verbinding. Probeer het zo nog eens.';
  return 'Dat lukte niet. Probeer het nog eens.';
}

export function Login({ sb }: { sb: SupabaseClient }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(dutchError(err.message));
    setBusy(false);
  }

  async function forgot() {
    if (!email.trim()) {
      setError('Vul eerst je e-mailadres in.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    setBusy(false);
    if (err) setError(dutchError(err.message));
    else setInfo('Check je mail voor een link om een nieuw wachtwoord te kiezen.');
  }

  return (
    <main className="login">
      <Card radius={28} className="login__card">
        <Logo />
        <h1 className="login__title">Welkom thuis.</h1>
        <p className="login__lead">Log in om je planten, het weer, de shit counter en jullie muziek te zien.</p>
        <form className="login__form" onSubmit={submit}>
          <label className="login__field">
            <span>E-mail</span>
            <input className="field" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="login__field">
            <span>Wachtwoord</span>
            <input className="field" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <p className="login__error" role="alert">{error}</p>}
          {info && <p className="login__info" role="status">{info}</p>}
          <Button type="submit" size="lg" disabled={busy}>{busy ? 'Even geduld…' : 'Inloggen'}</Button>
          <Button variant="ghost" onClick={forgot} disabled={busy}>Wachtwoord vergeten?</Button>
        </form>
      </Card>
    </main>
  );
}

export function NewPassword({ sb, onDone }: { sb: SupabaseClient; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error: err } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(dutchError(err.message));
    else onDone();
  }

  return (
    <main className="login">
      <Card radius={28} className="login__card">
        <Logo />
        <h1 className="login__title">Nieuw wachtwoord</h1>
        <form className="login__form" onSubmit={submit}>
          <label className="login__field">
            <span>Kies een wachtwoord (minstens 8 tekens)</span>
            <input className="field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <p className="login__error" role="alert">{error}</p>}
          <Button type="submit" size="lg" disabled={busy}>Opslaan</Button>
        </form>
      </Card>
    </main>
  );
}

export function Splash() {
  return (
    <main className="login" aria-busy="true">
      <Logo />
    </main>
  );
}
