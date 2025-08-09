drop policy "Company members can view candidate interviews" on "public"."candidate_job_interviews";

drop policy "Company members can view their questions" on "public"."company_interview_question_bank";

drop policy "Company members can view interview questions" on "public"."job_interview_questions";

create policy "Candidates can view question bank entries for assigned intervie"
on "public"."company_interview_question_bank"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((job_interview_questions jij
     JOIN candidate_job_interviews cji ON ((cji.interview_id = jij.interview_id)))
     JOIN company_job_candidates cjc ON ((cjc.id = cji.candidate_id)))
  WHERE ((jij.question_id = company_interview_question_bank.id) AND (cjc.candidate_user_id = auth.uid())))));


create policy "Candidates can view interview questions"
on "public"."job_interview_questions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (candidate_job_interviews cji
     JOIN company_job_candidates cjc ON ((cjc.id = cji.candidate_id)))
  WHERE ((cji.interview_id = job_interview_questions.interview_id) AND (cjc.candidate_user_id = auth.uid())))));



