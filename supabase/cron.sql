-- Elk uur Spotify bijwerken. Uitvoeren in Supabase > SQL Editor, nadat de
-- Edge Functions zijn gedeployd. Vul eerst de twee waarden hieronder in
-- (alleen in de SQL Editor, niet in dit bestand: de CRON_SECRET hoort niet in git).
-- Je kunt dit script gerust opnieuw draaien: bestaande waarden worden bijgewerkt.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Je project-URL en dezelfde CRON_SECRET als bij de Edge Function-secrets.
do $$
declare
  v_url    text := 'https://JOUW-PROJECT.supabase.co';
  v_secret text := 'VUL-HIER-JE-CRON_SECRET-IN';
  v_id     uuid;
begin
  select id into v_id from vault.secrets where name = 'balkon_project_url';
  if v_id is null then
    perform vault.create_secret(v_url, 'balkon_project_url');
  else
    perform vault.update_secret(v_id, v_url);
  end if;

  select id into v_id from vault.secrets where name = 'balkon_cron_secret';
  if v_id is null then
    perform vault.create_secret(v_secret, 'balkon_cron_secret');
  else
    perform vault.update_secret(v_id, v_secret);
  end if;
end $$;

-- 2. Elk uur, 7 minuten over het hele uur. Bestaat de taak al, dan wordt hij vervangen.
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
-- Antwoord zien: select status_code, content::text, error_msg from net._http_response order by created desc limit 5;
-- Stoppen:       select cron.unschedule('balkon-spotify-sync');
