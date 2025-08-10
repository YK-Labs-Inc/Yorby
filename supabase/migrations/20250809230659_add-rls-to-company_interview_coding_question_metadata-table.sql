create policy "Candidates can view coding question metadata for their intervie"
on "public"."company_interview_coding_question_metadata"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((candidate_job_interviews cji
     JOIN job_interviews ji ON ((cji.interview_id = ji.id)))
     JOIN job_interview_questions jiq ON ((ji.id = jiq.interview_id)))
  WHERE ((jiq.question_id = company_interview_coding_question_metadata.id) AND (cji.candidate_id IN ( SELECT company_job_candidates.id
           FROM company_job_candidates
          WHERE (company_job_candidates.candidate_user_id = auth.uid())))))));


create policy "Company members have full access to coding question metadata"
on "public"."company_interview_coding_question_metadata"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM (company_interview_question_bank q
     JOIN company_members m ON ((q.company_id = m.company_id)))
  WHERE ((q.id = company_interview_coding_question_metadata.id) AND (m.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (company_interview_question_bank q
     JOIN company_members m ON ((q.company_id = m.company_id)))
  WHERE ((q.id = company_interview_coding_question_metadata.id) AND (m.user_id = auth.uid())))));



