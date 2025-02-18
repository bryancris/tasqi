
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the notification processing to run every minute
SELECT cron.schedule(
  'process-notifications-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://mcwlzrikidzgxexnccju.supabase.co/functions/v1/process-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
