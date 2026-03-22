
SELECT cron.schedule(
  'weekly-adjustment-cron',
  '0 3 * * 1',
  $$
  SELECT
    net.http_post(
      url:='https://imdldceugiairplylnqq.supabase.co/functions/v1/weekly-adjustment',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZGxkY2V1Z2lhaXJwbHlsbnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTA2ODIsImV4cCI6MjA4NzM2NjY4Mn0.YqPzrJ-WT6mLWtzmQnLrQ5-FYEhlzrxTkwxsJg8xGL0"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
