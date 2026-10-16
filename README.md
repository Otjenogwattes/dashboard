# Balkon

Persoonlijk dashboard voor twee: planten (tomaat en basilicum), het weer met kledingadvies en vorstwaarschuwing, een gedeelde shit counter en wat jullie deze week op Spotify draaiden. Werkt als app op je telefoon (PWA).

**Stack:** Vite + React + TypeScript, CSS-variabelen voor alle tokens, Supabase (inloggen, gedeelde data, realtime, Edge Functions), Open-Meteo voor het weer. Hosting via Vercel.

Zonder Supabase-sleutels draait Balkon in **demo-modus** met de voorbeelddata uit het ontwerp, bewaard in je browser. Handig om te kijken; voor delen met z'n tweeën heb je Supabase nodig.

---

## 1. Lokaal draaien

Nodig: [Node.js](https://nodejs.org) 20 of nieuwer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + productiebuild in dist/
```

Kopieer `.env.example` naar `.env` en vul de Supabase-waarden in (stap 2). Zonder `.env` start de demo-modus.

## 2. Supabase (data en inloggen)

1. Maak een project op [supabase.com](https://supabase.com) (regio Frankfurt of Amsterdam).
2. **SQL Editor** → plak de inhoud van [`supabase/migrations/20261016120000_balkon.sql`](supabase/migrations/20261016120000_balkon.sql) → *Run*. Dit maakt de tabellen, de beveiliging (RLS) en realtime aan.
3. **Authentication → Sign In / Providers**: zet *Allow new users to sign up* **uit**. Alleen jullie twee mogen erin.
4. **Authentication → Users → Add user → Create new user**: maak jouw account en dat van Nikki aan (e-mail + wachtwoord, *Auto Confirm User* aan). Je naam pas je daarna aan in de app onder Meer.
5. **Authentication → URL Configuration**: zet *Site URL* op je Vercel-adres (stap 3) en voeg het toe bij *Redirect URLs*. Nodig voor "Wachtwoord vergeten".
6. **Project Settings → API**: kopieer de *Project URL* en de *publishable key* (of de anon key) naar `.env`:

```
VITE_SUPABASE_URL=https://jouw-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

## 3. Vercel (live zetten)

1. Op [vercel.com](https://vercel.com): **Add New → Project** → importeer de GitHub-repo `Otjenogwattes/dashboard`.
2. Framework: Vite (wordt herkend). Build: `npm run build`, output: `dist`.
3. **Environment Variables**: zet `VITE_SUPABASE_URL` en `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy. Daarna gaat elke push naar `main` vanzelf live.

**Op je telefoon:** open het Vercel-adres. iPhone: deelknop → *Zet op beginscherm*. Android: menu → *App installeren*.

## 4. Spotify (muziek-duet)

### 4a. Spotify-app aanmaken

1. Ga naar [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → **Create app**.
2. *Redirect URI*: `https://JOUW-PROJECT.supabase.co/functions/v1/spotify-callback`
3. *Which API/SDKs*: **Web API**.
4. **Settings → User Management**: voeg jouw Spotify-account en dat van Nikki toe (naam + e-mail van het Spotify-account). In ontwikkelmodus kunnen alleen deze accounts koppelen.
5. Noteer de *Client ID* en *Client secret*.

### 4b. Edge Functions deployen

De drie functies staan in [`supabase/functions/`](supabase/functions):

| Functie | Wat |
|---|---|
| `spotify-auth` | Start de koppeling (geeft de Spotify-inlogpagina terug) en ontkoppelt. |
| `spotify-callback` | Spotify stuurt je hierheen na toestemming; bewaart de token en haalt meteen je eerste nummers op. |
| `spotify-sync` | Haalt elk uur per persoon de recent gespeelde nummers op (Spotify geeft er max. 50 per keer). |

Met de Supabase CLI (via `npx`, geen installatie nodig):

```bash
npx supabase login
npx supabase link --project-ref JOUW-PROJECT-REF
npx supabase functions deploy          # deployt alle drie
```

`supabase/config.toml` zet *Verify JWT* uit voor deze drie; de functies controleren zelf de sessie of het `CRON_SECRET`. Deploy je via het dashboard (*Edge Functions → Deploy a new function → Via Editor*), zet dan per functie **Enforce JWT verification uit**.

### 4c. Secrets

Kopieer `supabase/functions/.env.example` naar `supabase/functions/.env`, vul hem in en zet hem in Supabase:

```bash
npx supabase secrets set --env-file supabase/functions/.env
```

Of zet ze met de hand onder **Edge Functions → Secrets**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `APP_URL` (je Vercel-adres, zonder `/` aan het eind) en `CRON_SECRET` (zelfbedacht lang wachtwoord).

### 4d. Elk uur bijwerken

Open [`supabase/cron.sql`](supabase/cron.sql), vul je project-URL en hetzelfde `CRON_SECRET` in, en voer het uit in de **SQL Editor**. Dat plant `spotify-sync` elk uur in (pg_cron + pg_net).

Daarna in de app: **Muziek** of **Meer → Spotify koppelen**. Nikki doet hetzelfde op haar telefoon. Na het koppelen staan je laatste 50 nummers er meteen in; de weektotalen vullen zich in de dagen daarna.

---

## Hoe het werkt

- **Weer**: Open-Meteo-uurverwachting (gratis, geen sleutel), elk half uur ververst en offline bewaard. Plaats kies je onder Meer (standaard Utrecht).
  - Kledingadvies voor 08:00, 14:00 en 20:00 gaat op gevoelstemperatuur en regenkans. Regenkans van 50% of meer geeft een regenjas, bij vorst 's avonds handschoenen. Verder loopt het van muts en handschoenen via trui en vest tot T-shirt.
  - Vorst: is het nachtminimum (18:00 tot 09:00) 0 °C of lager, dan verschijnt de waarschuwing en de taak "Voor 20:00 naar binnen" bij de basilicum.
- **Planten**: er is geen vochtsensor, dus het vocht is een **schatting**.
  - Na *Water geven* staat het op 90%. Daarna droogt de pot per dag uit: tomaat 14%, basilicum 10%, sneller als het warm is.
  - Onder 50% verschijnt "Water geven", onder 25% (of bij vorst) staat de status op *Actie nodig*. Klopt de schatting niet, dan corrigeer je hem in Planten.
  - In september tot en met november, met nachten van 5 °C of kouder, komt "Laatste tomaten plukken" erbij.
  - De regels staan in [`src/features/plants/plantRules.ts`](src/features/plants/plantRules.ts).
- **Shit counter**: gedeeld en realtime.
  - +1 opent de cijferkiezer; pas na een cijfer (of *overslaan*) telt hij mee. Escape annuleert.
  - *oeps* haalt de laatste van vandaag weg.
  - *gem.* is het gemiddelde cijfer van vandaag. De weekgrafiek loopt van maandag tot en met zondag.
- **Muziek**: de afgelopen 7 dagen.
  - *Samen %* = 2 × Σ min(jij, Nikki) / (Σ jij + Σ Nikki) over alle artiesten. Dat is de overlap, gewogen naar het aantal keer gedraaid.
  - De top-artiesten zijn gerangschikt op aandeel per persoon, zodat jullie allebei evenveel meetellen.
- **Toegankelijkheid**: status altijd als vorm + tekst, klikvlakken van minstens 44 px, tekstcontrast minstens 4,5:1 in licht en donker, en alles werkt met het toetsenbord.
- **Thema**: licht/donker volgt het systeem. Wisselen kan rechtsboven (desktop) of onder Meer, net als het accent koraal/geel.

## Mappen

```
src/
  styles/tokens.css        alle design tokens (licht, donker, accent)
  components/              Card, Pill/StatusPill, Button, TaskCheckbox, ModuleMark, Logo…
  features/weather|plants|shit|music|notes
  screens/                 Vandaag, Planten, Muziek, Meer, Login
  data/                    Backend-interface, demo (localStorage) en Supabase
supabase/
  migrations/              database + RLS + realtime
  functions/               Spotify Edge Functions
  cron.sql                 uurlijkse sync
```

## Nog te doen

- Schermen *Herinneringen* en een uitgebreidere *Muziekanalyse* en *Plantenplanner* (volgen in dezelfde stijl).
- Echte foto's van de planten (nu gestreepte plekhouders).
