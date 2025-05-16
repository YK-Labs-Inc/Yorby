alter table "public"."custom_jobs" add column "source_custom_job_id" uuid;

alter table "public"."custom_jobs" add constraint "custom_jobs_source_custom_job_id_fkey" FOREIGN KEY (source_custom_job_id) REFERENCES custom_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_jobs" validate constraint "custom_jobs_source_custom_job_id_fkey";


