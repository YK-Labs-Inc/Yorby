CREATE UNIQUE INDEX candidate_job_interview_recordings_pkey ON public.candidate_job_interview_recordings USING btree (id);

alter table "public"."candidate_job_interview_recordings" add constraint "candidate_job_interview_recordings_pkey" PRIMARY KEY using index "candidate_job_interview_recordings_pkey";


