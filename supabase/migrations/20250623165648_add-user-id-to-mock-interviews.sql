alter table "public"."custom_job_mock_interviews" add column "user_id" uuid;

alter table "public"."custom_job_mock_interviews" add constraint "custom_job_mock_interviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."custom_job_mock_interviews" validate constraint "custom_job_mock_interviews_user_id_fkey";


