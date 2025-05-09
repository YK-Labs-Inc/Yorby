drop trigger if exists "New job " on "public"."custom_jobs";

CREATE TRIGGER "New job " AFTER INSERT ON public.custom_jobs FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://www.perfectinterview.ai/api/webhooks/supabase/new-custom-job', 'POST', '{"Content-type":"application/json","authorization":"Bearer AnCJ789rcEzFVF2npAogMVyq6OXdnCcY"}', '{}', '10000');


