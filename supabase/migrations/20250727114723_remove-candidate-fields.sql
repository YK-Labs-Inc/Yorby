alter table "public"."company_job_candidates" drop constraint "company_job_candidates_custom_job_id_candidate_email_key";

drop index if exists "public"."company_job_candidates_custom_job_id_candidate_email_key";

drop index if exists "public"."idx_company_job_candidates_candidate_email";

alter table "public"."company_job_candidates" drop column "candidate_email";

alter table "public"."company_job_candidates" drop column "candidate_name";

alter table "public"."company_job_candidates" drop column "candidate_phone";

alter table "public"."company_job_candidates" drop column "notes";

alter table "public"."company_job_candidates" drop column "resume_data";

alter table "public"."company_job_candidates" drop column "resume_url";

alter table "public"."company_job_candidates" alter column "candidate_user_id" set not null;


