alter table "public"."mock_interview_question_feedback" add column "mock_interview_question_id" uuid;

alter table "public"."mock_interview_question_feedback" add constraint "mock_interview_question_feedbac_mock_interview_question_id_fkey" FOREIGN KEY (mock_interview_question_id) REFERENCES mock_interview_questions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."mock_interview_question_feedback" validate constraint "mock_interview_question_feedbac_mock_interview_question_id_fkey";


