-- Elk uur Spotify bijwerken. Eenmalig uitvoeren in Supabase > SQL Editor,
-- nadat de Edge Functions zijn gedeployd. Vul eerst de twee waarden in.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Je project-URL en dezelfde CRON_SECRET als bij de Edge Function-secrets.
select vault.create_secret('https://JOUW-PROJECT.supabase.co', 'balkon_project_url');
select vault.create_secret('VUL-HIER-JE-CRON_SECRET-IN', 'balkon_cron_secret');

-- 2. Elk uur, 7 minuten over het hele uur.
select cron.schedule(
  'balkon-spotify-sync',
  '7 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'balkon_project_url') || '/functions/v1/spotify-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'balkon_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Controleren:   select * from cron.job_run_details order by start_time desc limit 5;
-- Stoppen:       select cron.unschedule('balkon-spotify-sync');
