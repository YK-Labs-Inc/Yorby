alter table "public"."custom_jobs" alter column "job_description" drop not null;

create policy "Allow delete access to custom_job_question_sample_answers for u"
on "public"."custom_job_question_sample_answers"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((custom_job_questions
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_questions.id = custom_job_question_sample_answers.question_id) AND (coaches.user_id = auth.uid())))));


create policy "Allow insert access to custom_job_question_sample_answers for u"
on "public"."custom_job_question_sample_answers"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM ((custom_job_questions
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_questions.id = custom_job_question_sample_answers.question_id) AND (coaches.user_id = auth.uid())))));


create policy "Allow select access to custom_job_question_sample_answers for u"
on "public"."custom_job_question_sample_answers"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((custom_job_questions
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_questions.id = custom_job_question_sample_answers.question_id) AND (coaches.user_id = auth.uid())))));


create policy "Allow update access to custom_job_question_sample_answers for u"
on "public"."custom_job_question_sample_answers"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM ((custom_job_questions
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_questions.id = custom_job_question_sample_answers.question_id) AND (coaches.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM ((custom_job_questions
     JOIN custom_jobs ON ((custom_job_questions.custom_job_id = custom_jobs.id)))
     JOIN coaches ON ((custom_jobs.coach_id = coaches.id)))
  WHERE ((custom_job_questions.id = custom_job_question_sample_answers.question_id) AND (coaches.user_id = auth.uid())))));



