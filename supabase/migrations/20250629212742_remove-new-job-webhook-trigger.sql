-- Remove the trigger that calls the webhook for new custom jobs
DROP TRIGGER IF EXISTS "New job " ON "public"."custom_jobs";