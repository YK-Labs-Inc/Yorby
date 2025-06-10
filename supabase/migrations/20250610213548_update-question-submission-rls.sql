drop policy "Allow delete access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow insert access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow select access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow select for admins" on "public"."custom_job_question_submissions";

drop policy "Allow update access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

create policy "Enable all operations if user owns parent custom job"
on "public"."custom_job_question_submissions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (custom_job_questions q
     JOIN custom_jobs j ON ((q.custom_job_id = j.id)))
  WHERE ((q.id = custom_job_question_submissions.custom_job_question_id) AND (j.user_id = auth.uid())))));



