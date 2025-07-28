alter table "public"."company_job_candidates" drop constraint "company_job_candidates_candidate_user_id_fkey";

alter table "public"."company_job_candidates" drop constraint "company_job_candidates_company_id_fkey";

alter table "public"."company_job_candidates" drop constraint "company_job_candidates_custom_job_id_fkey";

alter table "public"."company_job_candidates" add constraint "company_job_candidates_candidate_user_id_fkey" FOREIGN KEY (candidate_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."company_job_candidates" validate constraint "company_job_candidates_candidate_user_id_fkey";

alter table "public"."company_job_candidates" add constraint "company_job_candidates_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."company_job_candidates" validate constraint "company_job_candidates_company_id_fkey";

alter table "public"."company_job_candidates" add constraint "company_job_candidates_custom_job_id_fkey" FOREIGN KEY (custom_job_id) REFERENCES custom_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."company_job_candidates" validate constraint "company_job_candidates_custom_job_id_fkey";


