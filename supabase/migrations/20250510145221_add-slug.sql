drop trigger if exists "New job " on "public"."custom_jobs";

drop trigger if exists "new-referral" on "public"."referrals";

drop trigger if exists "handle_updated_at" on "public"."resumes";

drop policy "Coaches can manage their own coach record" on "public"."coaches";

drop policy "Enable read access for all users" on "public"."coaches";

drop policy "Enable all for users based on user_id" on "public"."custom_job_credits";

drop policy "Allow delete access to custom_job_files for users with access t" on "public"."custom_job_files";

drop policy "Allow insert access to custom_job_files for users with access t" on "public"."custom_job_files";

drop policy "Allow select access to custom_job_files for users with access t" on "public"."custom_job_files";

drop policy "Allow update access to custom_job_files for users with access t" on "public"."custom_job_files";

drop policy "Allow delete access to custom_job_mock_interview_feedback for u" on "public"."custom_job_mock_interview_feedback";

drop policy "Allow insert access to custom_job_mock_interview_feedback for u" on "public"."custom_job_mock_interview_feedback";

drop policy "Allow select access to custom_job_mock_interview_feedback for a" on "public"."custom_job_mock_interview_feedback";

drop policy "Allow select access to custom_job_mock_interview_feedback for u" on "public"."custom_job_mock_interview_feedback";

drop policy "Allow update access to custom_job_mock_interview_feedback for u" on "public"."custom_job_mock_interview_feedback";

drop policy "Allow delete access to custom_job_mock_interviews for users wit" on "public"."custom_job_mock_interviews";

drop policy "Allow insert access to custom_job_mock_interviews for users wit" on "public"."custom_job_mock_interviews";

drop policy "Allow select access to custom_job_mock_interviews for users wit" on "public"."custom_job_mock_interviews";

drop policy "Allow select for admins" on "public"."custom_job_mock_interviews";

drop policy "Allow update access to custom_job_mock_interviews for users wit" on "public"."custom_job_mock_interviews";

drop policy "Allow delete access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow insert access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow select access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow select for admins" on "public"."custom_job_question_submissions";

drop policy "Allow update access to custom_job_question_submissions for user" on "public"."custom_job_question_submissions";

drop policy "Allow delete access to custom_job_questions for users with acce" on "public"."custom_job_questions";

drop policy "Allow insert access to custom_job_questions for users with acce" on "public"."custom_job_questions";

drop policy "Allow select access to custom_job_questions for users with acce" on "public"."custom_job_questions";

drop policy "Allow select access to custom_job_questions for users with coac" on "public"."custom_job_questions";

drop policy "Allow select for admins" on "public"."custom_job_questions";

drop policy "Allow update access to custom_job_questions for users with acce" on "public"."custom_job_questions";

drop policy "Allow select access to custom_jobs for users with coach access" on "public"."custom_jobs";

drop policy "Allow select for admins" on "public"."custom_jobs";

drop policy "Coaches can manage their B2B custom_jobs" on "public"."custom_jobs";

drop policy "Enable all for users based on user_id" on "public"."custom_jobs";

drop policy "Enable read access for all users" on "public"."demo_job_questions";

drop policy "Enable read access for all users" on "public"."demo_jobs";

drop policy "Enable insert access for all users" on "public"."email_waitlist";

drop policy "Enable insert access for all users" on "public"."interview_copilot_demo_files";

drop policy "Enable all for users if they have access to parent copilot" on "public"."interview_copilot_files";

drop policy "Allow delete access to interview_copilot_questions_and_answers " on "public"."interview_copilot_questions_and_answers";

drop policy "Allow insert access to interview_copilot_questions_and_answers " on "public"."interview_copilot_questions_and_answers";

drop policy "Allow select access to interview_copilot_questions_and_answers " on "public"."interview_copilot_questions_and_answers";

drop policy "Allow update access to interview_copilot_questions_and_answers " on "public"."interview_copilot_questions_and_answers";

drop policy "Allow admins read access" on "public"."interview_copilots";

drop policy "Enable all for users based on user_id" on "public"."interview_copilots";

drop policy "Allow delete access to mock_interview_messages for users with a" on "public"."mock_interview_messages";

drop policy "Allow insert access to mock_interview_messages for users with a" on "public"."mock_interview_messages";

drop policy "Allow select access to mock_interview_messages for users with a" on "public"."mock_interview_messages";

drop policy "Allow select for admins" on "public"."mock_interview_messages";

drop policy "Allow update access to mock_interview_messages for users with a" on "public"."mock_interview_messages";

drop policy "Allow delete access to mock_interview_question_feedback for use" on "public"."mock_interview_question_feedback";

drop policy "Allow insert access to mock_interview_question_feedback for use" on "public"."mock_interview_question_feedback";

drop policy "Allow select access to mock_interview_question_feedback for use" on "public"."mock_interview_question_feedback";

drop policy "Allow select for admins" on "public"."mock_interview_question_feedback";

drop policy "Allow update access to mock_interview_question_feedback for use" on "public"."mock_interview_question_feedback";

drop policy "Enable all for users based on user_id" on "public"."referral_codes";

drop policy "Enable all for users based on user_id" on "public"."referral_redemptions";

drop policy "Enable all for users based on user_id" on "public"."referrals";

drop policy "Access resume detail items through sections" on "public"."resume_detail_items";

drop policy "Allow all for users based on resume access" on "public"."resume_edits";

drop policy "Access resume item descriptions through detail items" on "public"."resume_item_descriptions";

drop policy "Access resume list items through sections" on "public"."resume_list_items";

drop policy "Enable select access if they have access to parent resume" on "public"."resume_metadata";

drop policy "Access resume sections through resumes" on "public"."resume_sections";

drop policy "Allow select access to demo resume" on "public"."resumes";

drop policy "Allow select access to resumes for admins" on "public"."resumes";

drop policy "Users can only access their own resumes" on "public"."resumes";

drop policy "Enable select for users based on id" on "public"."subscriptions";

drop policy "Coaches can manage user_coach_access entries for their coaching" on "public"."user_coach_access";

drop policy "Enable all for users based on user_id" on "public"."user_coach_access";

drop policy "Enable all for users based on user_id" on "public"."user_files";

drop policy "Enable all for users based on user_id" on "public"."user_knowledge_base";

drop policy "Enable all for users based on user_id" on "public"."user_knowledge_base_conversations";

drop policy "Allow delete access to user_knowledge_base_messages for users w" on "public"."user_knowledge_base_messages";

drop policy "Allow insert access to user_knowledge_base_messages for users w" on "public"."user_knowledge_base_messages";

drop policy "Allow select access to user_knowledge_base_messages for users w" on "public"."user_knowledge_base_messages";

drop policy "Allow update access to user_knowledge_base_messages for users w" on "public"."user_knowledge_base_messages";

revoke delete on table "public"."coaches" from "anon";

revoke insert on table "public"."coaches" from "anon";

revoke references on table "public"."coaches" from "anon";

revoke select on table "public"."coaches" from "anon";

revoke trigger on table "public"."coaches" from "anon";

revoke truncate on table "public"."coaches" from "anon";

revoke update on table "public"."coaches" from "anon";

revoke delete on table "public"."coaches" from "authenticated";

revoke insert on table "public"."coaches" from "authenticated";

revoke references on table "public"."coaches" from "authenticated";

revoke select on table "public"."coaches" from "authenticated";

revoke trigger on table "public"."coaches" from "authenticated";

revoke truncate on table "public"."coaches" from "authenticated";

revoke update on table "public"."coaches" from "authenticated";

revoke delete on table "public"."coaches" from "service_role";

revoke insert on table "public"."coaches" from "service_role";

revoke references on table "public"."coaches" from "service_role";

revoke select on table "public"."coaches" from "service_role";

revoke trigger on table "public"."coaches" from "service_role";

revoke truncate on table "public"."coaches" from "service_role";

revoke update on table "public"."coaches" from "service_role";

revoke delete on table "public"."custom_job_categories" from "anon";

revoke insert on table "public"."custom_job_categories" from "anon";

revoke references on table "public"."custom_job_categories" from "anon";

revoke select on table "public"."custom_job_categories" from "anon";

revoke trigger on table "public"."custom_job_categories" from "anon";

revoke truncate on table "public"."custom_job_categories" from "anon";

revoke update on table "public"."custom_job_categories" from "anon";

revoke delete on table "public"."custom_job_categories" from "authenticated";

revoke insert on table "public"."custom_job_categories" from "authenticated";

revoke references on table "public"."custom_job_categories" from "authenticated";

revoke select on table "public"."custom_job_categories" from "authenticated";

revoke trigger on table "public"."custom_job_categories" from "authenticated";

revoke truncate on table "public"."custom_job_categories" from "authenticated";

revoke update on table "public"."custom_job_categories" from "authenticated";

revoke delete on table "public"."custom_job_categories" from "service_role";

revoke insert on table "public"."custom_job_categories" from "service_role";

revoke references on table "public"."custom_job_categories" from "service_role";

revoke select on table "public"."custom_job_categories" from "service_role";

revoke trigger on table "public"."custom_job_categories" from "service_role";

revoke truncate on table "public"."custom_job_categories" from "service_role";

revoke update on table "public"."custom_job_categories" from "service_role";

revoke delete on table "public"."custom_job_credits" from "anon";

revoke insert on table "public"."custom_job_credits" from "anon";

revoke references on table "public"."custom_job_credits" from "anon";

revoke select on table "public"."custom_job_credits" from "anon";

revoke trigger on table "public"."custom_job_credits" from "anon";

revoke truncate on table "public"."custom_job_credits" from "anon";

revoke update on table "public"."custom_job_credits" from "anon";

revoke delete on table "public"."custom_job_credits" from "authenticated";

revoke insert on table "public"."custom_job_credits" from "authenticated";

revoke references on table "public"."custom_job_credits" from "authenticated";

revoke select on table "public"."custom_job_credits" from "authenticated";

revoke trigger on table "public"."custom_job_credits" from "authenticated";

revoke truncate on table "public"."custom_job_credits" from "authenticated";

revoke update on table "public"."custom_job_credits" from "authenticated";

revoke delete on table "public"."custom_job_credits" from "service_role";

revoke insert on table "public"."custom_job_credits" from "service_role";

revoke references on table "public"."custom_job_credits" from "service_role";

revoke select on table "public"."custom_job_credits" from "service_role";

revoke trigger on table "public"."custom_job_credits" from "service_role";

revoke truncate on table "public"."custom_job_credits" from "service_role";

revoke update on table "public"."custom_job_credits" from "service_role";

revoke delete on table "public"."custom_job_files" from "anon";

revoke insert on table "public"."custom_job_files" from "anon";

revoke references on table "public"."custom_job_files" from "anon";

revoke select on table "public"."custom_job_files" from "anon";

revoke trigger on table "public"."custom_job_files" from "anon";

revoke truncate on table "public"."custom_job_files" from "anon";

revoke update on table "public"."custom_job_files" from "anon";

revoke delete on table "public"."custom_job_files" from "authenticated";

revoke insert on table "public"."custom_job_files" from "authenticated";

revoke references on table "public"."custom_job_files" from "authenticated";

revoke select on table "public"."custom_job_files" from "authenticated";

revoke trigger on table "public"."custom_job_files" from "authenticated";

revoke truncate on table "public"."custom_job_files" from "authenticated";

revoke update on table "public"."custom_job_files" from "authenticated";

revoke delete on table "public"."custom_job_files" from "service_role";

revoke insert on table "public"."custom_job_files" from "service_role";

revoke references on table "public"."custom_job_files" from "service_role";

revoke select on table "public"."custom_job_files" from "service_role";

revoke trigger on table "public"."custom_job_files" from "service_role";

revoke truncate on table "public"."custom_job_files" from "service_role";

revoke update on table "public"."custom_job_files" from "service_role";

revoke delete on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke insert on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke references on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke select on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke trigger on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke truncate on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke update on table "public"."custom_job_mock_interview_feedback" from "anon";

revoke delete on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke insert on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke references on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke select on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke trigger on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke truncate on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke update on table "public"."custom_job_mock_interview_feedback" from "authenticated";

revoke delete on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke insert on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke references on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke select on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke trigger on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke truncate on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke update on table "public"."custom_job_mock_interview_feedback" from "service_role";

revoke delete on table "public"."custom_job_mock_interviews" from "anon";

revoke insert on table "public"."custom_job_mock_interviews" from "anon";

revoke references on table "public"."custom_job_mock_interviews" from "anon";

revoke select on table "public"."custom_job_mock_interviews" from "anon";

revoke trigger on table "public"."custom_job_mock_interviews" from "anon";

revoke truncate on table "public"."custom_job_mock_interviews" from "anon";

revoke update on table "public"."custom_job_mock_interviews" from "anon";

revoke delete on table "public"."custom_job_mock_interviews" from "authenticated";

revoke insert on table "public"."custom_job_mock_interviews" from "authenticated";

revoke references on table "public"."custom_job_mock_interviews" from "authenticated";

revoke select on table "public"."custom_job_mock_interviews" from "authenticated";

revoke trigger on table "public"."custom_job_mock_interviews" from "authenticated";

revoke truncate on table "public"."custom_job_mock_interviews" from "authenticated";

revoke update on table "public"."custom_job_mock_interviews" from "authenticated";

revoke delete on table "public"."custom_job_mock_interviews" from "service_role";

revoke insert on table "public"."custom_job_mock_interviews" from "service_role";

revoke references on table "public"."custom_job_mock_interviews" from "service_role";

revoke select on table "public"."custom_job_mock_interviews" from "service_role";

revoke trigger on table "public"."custom_job_mock_interviews" from "service_role";

revoke truncate on table "public"."custom_job_mock_interviews" from "service_role";

revoke update on table "public"."custom_job_mock_interviews" from "service_role";

revoke delete on table "public"."custom_job_question_submissions" from "anon";

revoke insert on table "public"."custom_job_question_submissions" from "anon";

revoke references on table "public"."custom_job_question_submissions" from "anon";

revoke select on table "public"."custom_job_question_submissions" from "anon";

revoke trigger on table "public"."custom_job_question_submissions" from "anon";

revoke truncate on table "public"."custom_job_question_submissions" from "anon";

revoke update on table "public"."custom_job_question_submissions" from "anon";

revoke delete on table "public"."custom_job_question_submissions" from "authenticated";

revoke insert on table "public"."custom_job_question_submissions" from "authenticated";

revoke references on table "public"."custom_job_question_submissions" from "authenticated";

revoke select on table "public"."custom_job_question_submissions" from "authenticated";

revoke trigger on table "public"."custom_job_question_submissions" from "authenticated";

revoke truncate on table "public"."custom_job_question_submissions" from "authenticated";

revoke update on table "public"."custom_job_question_submissions" from "authenticated";

revoke delete on table "public"."custom_job_question_submissions" from "service_role";

revoke insert on table "public"."custom_job_question_submissions" from "service_role";

revoke references on table "public"."custom_job_question_submissions" from "service_role";

revoke select on table "public"."custom_job_question_submissions" from "service_role";

revoke trigger on table "public"."custom_job_question_submissions" from "service_role";

revoke truncate on table "public"."custom_job_question_submissions" from "service_role";

revoke update on table "public"."custom_job_question_submissions" from "service_role";

revoke delete on table "public"."custom_job_questions" from "anon";

revoke insert on table "public"."custom_job_questions" from "anon";

revoke references on table "public"."custom_job_questions" from "anon";

revoke select on table "public"."custom_job_questions" from "anon";

revoke trigger on table "public"."custom_job_questions" from "anon";

revoke truncate on table "public"."custom_job_questions" from "anon";

revoke update on table "public"."custom_job_questions" from "anon";

revoke delete on table "public"."custom_job_questions" from "authenticated";

revoke insert on table "public"."custom_job_questions" from "authenticated";

revoke references on table "public"."custom_job_questions" from "authenticated";

revoke select on table "public"."custom_job_questions" from "authenticated";

revoke trigger on table "public"."custom_job_questions" from "authenticated";

revoke truncate on table "public"."custom_job_questions" from "authenticated";

revoke update on table "public"."custom_job_questions" from "authenticated";

revoke delete on table "public"."custom_job_questions" from "service_role";

revoke insert on table "public"."custom_job_questions" from "service_role";

revoke references on table "public"."custom_job_questions" from "service_role";

revoke select on table "public"."custom_job_questions" from "service_role";

revoke trigger on table "public"."custom_job_questions" from "service_role";

revoke truncate on table "public"."custom_job_questions" from "service_role";

revoke update on table "public"."custom_job_questions" from "service_role";

revoke delete on table "public"."custom_jobs" from "anon";

revoke insert on table "public"."custom_jobs" from "anon";

revoke references on table "public"."custom_jobs" from "anon";

revoke select on table "public"."custom_jobs" from "anon";

revoke trigger on table "public"."custom_jobs" from "anon";

revoke truncate on table "public"."custom_jobs" from "anon";

revoke update on table "public"."custom_jobs" from "anon";

revoke delete on table "public"."custom_jobs" from "authenticated";

revoke insert on table "public"."custom_jobs" from "authenticated";

revoke references on table "public"."custom_jobs" from "authenticated";

revoke select on table "public"."custom_jobs" from "authenticated";

revoke trigger on table "public"."custom_jobs" from "authenticated";

revoke truncate on table "public"."custom_jobs" from "authenticated";

revoke update on table "public"."custom_jobs" from "authenticated";

revoke delete on table "public"."custom_jobs" from "service_role";

revoke insert on table "public"."custom_jobs" from "service_role";

revoke references on table "public"."custom_jobs" from "service_role";

revoke select on table "public"."custom_jobs" from "service_role";

revoke trigger on table "public"."custom_jobs" from "service_role";

revoke truncate on table "public"."custom_jobs" from "service_role";

revoke update on table "public"."custom_jobs" from "service_role";

revoke delete on table "public"."demo_job_questions" from "anon";

revoke insert on table "public"."demo_job_questions" from "anon";

revoke references on table "public"."demo_job_questions" from "anon";

revoke select on table "public"."demo_job_questions" from "anon";

revoke trigger on table "public"."demo_job_questions" from "anon";

revoke truncate on table "public"."demo_job_questions" from "anon";

revoke update on table "public"."demo_job_questions" from "anon";

revoke delete on table "public"."demo_job_questions" from "authenticated";

revoke insert on table "public"."demo_job_questions" from "authenticated";

revoke references on table "public"."demo_job_questions" from "authenticated";

revoke select on table "public"."demo_job_questions" from "authenticated";

revoke trigger on table "public"."demo_job_questions" from "authenticated";

revoke truncate on table "public"."demo_job_questions" from "authenticated";

revoke update on table "public"."demo_job_questions" from "authenticated";

revoke delete on table "public"."demo_job_questions" from "service_role";

revoke insert on table "public"."demo_job_questions" from "service_role";

revoke references on table "public"."demo_job_questions" from "service_role";

revoke select on table "public"."demo_job_questions" from "service_role";

revoke trigger on table "public"."demo_job_questions" from "service_role";

revoke truncate on table "public"."demo_job_questions" from "service_role";

revoke update on table "public"."demo_job_questions" from "service_role";

revoke delete on table "public"."demo_jobs" from "anon";

revoke insert on table "public"."demo_jobs" from "anon";

revoke references on table "public"."demo_jobs" from "anon";

revoke select on table "public"."demo_jobs" from "anon";

revoke trigger on table "public"."demo_jobs" from "anon";

revoke truncate on table "public"."demo_jobs" from "anon";

revoke update on table "public"."demo_jobs" from "anon";

revoke delete on table "public"."demo_jobs" from "authenticated";

revoke insert on table "public"."demo_jobs" from "authenticated";

revoke references on table "public"."demo_jobs" from "authenticated";

revoke select on table "public"."demo_jobs" from "authenticated";

revoke trigger on table "public"."demo_jobs" from "authenticated";

revoke truncate on table "public"."demo_jobs" from "authenticated";

revoke update on table "public"."demo_jobs" from "authenticated";

revoke delete on table "public"."demo_jobs" from "service_role";

revoke insert on table "public"."demo_jobs" from "service_role";

revoke references on table "public"."demo_jobs" from "service_role";

revoke select on table "public"."demo_jobs" from "service_role";

revoke trigger on table "public"."demo_jobs" from "service_role";

revoke truncate on table "public"."demo_jobs" from "service_role";

revoke update on table "public"."demo_jobs" from "service_role";

revoke delete on table "public"."email_waitlist" from "anon";

revoke insert on table "public"."email_waitlist" from "anon";

revoke references on table "public"."email_waitlist" from "anon";

revoke select on table "public"."email_waitlist" from "anon";

revoke trigger on table "public"."email_waitlist" from "anon";

revoke truncate on table "public"."email_waitlist" from "anon";

revoke update on table "public"."email_waitlist" from "anon";

revoke delete on table "public"."email_waitlist" from "authenticated";

revoke insert on table "public"."email_waitlist" from "authenticated";

revoke references on table "public"."email_waitlist" from "authenticated";

revoke select on table "public"."email_waitlist" from "authenticated";

revoke trigger on table "public"."email_waitlist" from "authenticated";

revoke truncate on table "public"."email_waitlist" from "authenticated";

revoke update on table "public"."email_waitlist" from "authenticated";

revoke delete on table "public"."email_waitlist" from "service_role";

revoke insert on table "public"."email_waitlist" from "service_role";

revoke references on table "public"."email_waitlist" from "service_role";

revoke select on table "public"."email_waitlist" from "service_role";

revoke trigger on table "public"."email_waitlist" from "service_role";

revoke truncate on table "public"."email_waitlist" from "service_role";

revoke update on table "public"."email_waitlist" from "service_role";

revoke delete on table "public"."interview_copilot_demo_files" from "anon";

revoke insert on table "public"."interview_copilot_demo_files" from "anon";

revoke references on table "public"."interview_copilot_demo_files" from "anon";

revoke select on table "public"."interview_copilot_demo_files" from "anon";

revoke trigger on table "public"."interview_copilot_demo_files" from "anon";

revoke truncate on table "public"."interview_copilot_demo_files" from "anon";

revoke update on table "public"."interview_copilot_demo_files" from "anon";

revoke delete on table "public"."interview_copilot_demo_files" from "authenticated";

revoke insert on table "public"."interview_copilot_demo_files" from "authenticated";

revoke references on table "public"."interview_copilot_demo_files" from "authenticated";

revoke select on table "public"."interview_copilot_demo_files" from "authenticated";

revoke trigger on table "public"."interview_copilot_demo_files" from "authenticated";

revoke truncate on table "public"."interview_copilot_demo_files" from "authenticated";

revoke update on table "public"."interview_copilot_demo_files" from "authenticated";

revoke delete on table "public"."interview_copilot_demo_files" from "service_role";

revoke insert on table "public"."interview_copilot_demo_files" from "service_role";

revoke references on table "public"."interview_copilot_demo_files" from "service_role";

revoke select on table "public"."interview_copilot_demo_files" from "service_role";

revoke trigger on table "public"."interview_copilot_demo_files" from "service_role";

revoke truncate on table "public"."interview_copilot_demo_files" from "service_role";

revoke update on table "public"."interview_copilot_demo_files" from "service_role";

revoke delete on table "public"."interview_copilot_files" from "anon";

revoke insert on table "public"."interview_copilot_files" from "anon";

revoke references on table "public"."interview_copilot_files" from "anon";

revoke select on table "public"."interview_copilot_files" from "anon";

revoke trigger on table "public"."interview_copilot_files" from "anon";

revoke truncate on table "public"."interview_copilot_files" from "anon";

revoke update on table "public"."interview_copilot_files" from "anon";

revoke delete on table "public"."interview_copilot_files" from "authenticated";

revoke insert on table "public"."interview_copilot_files" from "authenticated";

revoke references on table "public"."interview_copilot_files" from "authenticated";

revoke select on table "public"."interview_copilot_files" from "authenticated";

revoke trigger on table "public"."interview_copilot_files" from "authenticated";

revoke truncate on table "public"."interview_copilot_files" from "authenticated";

revoke update on table "public"."interview_copilot_files" from "authenticated";

revoke delete on table "public"."interview_copilot_files" from "service_role";

revoke insert on table "public"."interview_copilot_files" from "service_role";

revoke references on table "public"."interview_copilot_files" from "service_role";

revoke select on table "public"."interview_copilot_files" from "service_role";

revoke trigger on table "public"."interview_copilot_files" from "service_role";

revoke truncate on table "public"."interview_copilot_files" from "service_role";

revoke update on table "public"."interview_copilot_files" from "service_role";

revoke delete on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke insert on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke references on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke select on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke trigger on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke truncate on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke update on table "public"."interview_copilot_questions_and_answers" from "anon";

revoke delete on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke insert on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke references on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke select on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke trigger on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke truncate on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke update on table "public"."interview_copilot_questions_and_answers" from "authenticated";

revoke delete on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke insert on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke references on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke select on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke trigger on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke truncate on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke update on table "public"."interview_copilot_questions_and_answers" from "service_role";

revoke delete on table "public"."interview_copilots" from "anon";

revoke insert on table "public"."interview_copilots" from "anon";

revoke references on table "public"."interview_copilots" from "anon";

revoke select on table "public"."interview_copilots" from "anon";

revoke trigger on table "public"."interview_copilots" from "anon";

revoke truncate on table "public"."interview_copilots" from "anon";

revoke update on table "public"."interview_copilots" from "anon";

revoke delete on table "public"."interview_copilots" from "authenticated";

revoke insert on table "public"."interview_copilots" from "authenticated";

revoke references on table "public"."interview_copilots" from "authenticated";

revoke select on table "public"."interview_copilots" from "authenticated";

revoke trigger on table "public"."interview_copilots" from "authenticated";

revoke truncate on table "public"."interview_copilots" from "authenticated";

revoke update on table "public"."interview_copilots" from "authenticated";

revoke delete on table "public"."interview_copilots" from "service_role";

revoke insert on table "public"."interview_copilots" from "service_role";

revoke references on table "public"."interview_copilots" from "service_role";

revoke select on table "public"."interview_copilots" from "service_role";

revoke trigger on table "public"."interview_copilots" from "service_role";

revoke truncate on table "public"."interview_copilots" from "service_role";

revoke update on table "public"."interview_copilots" from "service_role";

revoke delete on table "public"."mock_interview_messages" from "anon";

revoke insert on table "public"."mock_interview_messages" from "anon";

revoke references on table "public"."mock_interview_messages" from "anon";

revoke select on table "public"."mock_interview_messages" from "anon";

revoke trigger on table "public"."mock_interview_messages" from "anon";

revoke truncate on table "public"."mock_interview_messages" from "anon";

revoke update on table "public"."mock_interview_messages" from "anon";

revoke delete on table "public"."mock_interview_messages" from "authenticated";

revoke insert on table "public"."mock_interview_messages" from "authenticated";

revoke references on table "public"."mock_interview_messages" from "authenticated";

revoke select on table "public"."mock_interview_messages" from "authenticated";

revoke trigger on table "public"."mock_interview_messages" from "authenticated";

revoke truncate on table "public"."mock_interview_messages" from "authenticated";

revoke update on table "public"."mock_interview_messages" from "authenticated";

revoke delete on table "public"."mock_interview_messages" from "service_role";

revoke insert on table "public"."mock_interview_messages" from "service_role";

revoke references on table "public"."mock_interview_messages" from "service_role";

revoke select on table "public"."mock_interview_messages" from "service_role";

revoke trigger on table "public"."mock_interview_messages" from "service_role";

revoke truncate on table "public"."mock_interview_messages" from "service_role";

revoke update on table "public"."mock_interview_messages" from "service_role";

revoke delete on table "public"."mock_interview_question_feedback" from "anon";

revoke insert on table "public"."mock_interview_question_feedback" from "anon";

revoke references on table "public"."mock_interview_question_feedback" from "anon";

revoke select on table "public"."mock_interview_question_feedback" from "anon";

revoke trigger on table "public"."mock_interview_question_feedback" from "anon";

revoke truncate on table "public"."mock_interview_question_feedback" from "anon";

revoke update on table "public"."mock_interview_question_feedback" from "anon";

revoke delete on table "public"."mock_interview_question_feedback" from "authenticated";

revoke insert on table "public"."mock_interview_question_feedback" from "authenticated";

revoke references on table "public"."mock_interview_question_feedback" from "authenticated";

revoke select on table "public"."mock_interview_question_feedback" from "authenticated";

revoke trigger on table "public"."mock_interview_question_feedback" from "authenticated";

revoke truncate on table "public"."mock_interview_question_feedback" from "authenticated";

revoke update on table "public"."mock_interview_question_feedback" from "authenticated";

revoke delete on table "public"."mock_interview_question_feedback" from "service_role";

revoke insert on table "public"."mock_interview_question_feedback" from "service_role";

revoke references on table "public"."mock_interview_question_feedback" from "service_role";

revoke select on table "public"."mock_interview_question_feedback" from "service_role";

revoke trigger on table "public"."mock_interview_question_feedback" from "service_role";

revoke truncate on table "public"."mock_interview_question_feedback" from "service_role";

revoke update on table "public"."mock_interview_question_feedback" from "service_role";

revoke delete on table "public"."referral_codes" from "anon";

revoke insert on table "public"."referral_codes" from "anon";

revoke references on table "public"."referral_codes" from "anon";

revoke select on table "public"."referral_codes" from "anon";

revoke trigger on table "public"."referral_codes" from "anon";

revoke truncate on table "public"."referral_codes" from "anon";

revoke update on table "public"."referral_codes" from "anon";

revoke delete on table "public"."referral_codes" from "authenticated";

revoke insert on table "public"."referral_codes" from "authenticated";

revoke references on table "public"."referral_codes" from "authenticated";

revoke select on table "public"."referral_codes" from "authenticated";

revoke trigger on table "public"."referral_codes" from "authenticated";

revoke truncate on table "public"."referral_codes" from "authenticated";

revoke update on table "public"."referral_codes" from "authenticated";

revoke delete on table "public"."referral_codes" from "service_role";

revoke insert on table "public"."referral_codes" from "service_role";

revoke references on table "public"."referral_codes" from "service_role";

revoke select on table "public"."referral_codes" from "service_role";

revoke trigger on table "public"."referral_codes" from "service_role";

revoke truncate on table "public"."referral_codes" from "service_role";

revoke update on table "public"."referral_codes" from "service_role";

revoke delete on table "public"."referral_redemptions" from "anon";

revoke insert on table "public"."referral_redemptions" from "anon";

revoke references on table "public"."referral_redemptions" from "anon";

revoke select on table "public"."referral_redemptions" from "anon";

revoke trigger on table "public"."referral_redemptions" from "anon";

revoke truncate on table "public"."referral_redemptions" from "anon";

revoke update on table "public"."referral_redemptions" from "anon";

revoke delete on table "public"."referral_redemptions" from "authenticated";

revoke insert on table "public"."referral_redemptions" from "authenticated";

revoke references on table "public"."referral_redemptions" from "authenticated";

revoke select on table "public"."referral_redemptions" from "authenticated";

revoke trigger on table "public"."referral_redemptions" from "authenticated";

revoke truncate on table "public"."referral_redemptions" from "authenticated";

revoke update on table "public"."referral_redemptions" from "authenticated";

revoke delete on table "public"."referral_redemptions" from "service_role";

revoke insert on table "public"."referral_redemptions" from "service_role";

revoke references on table "public"."referral_redemptions" from "service_role";

revoke select on table "public"."referral_redemptions" from "service_role";

revoke trigger on table "public"."referral_redemptions" from "service_role";

revoke truncate on table "public"."referral_redemptions" from "service_role";

revoke update on table "public"."referral_redemptions" from "service_role";

revoke delete on table "public"."referrals" from "anon";

revoke insert on table "public"."referrals" from "anon";

revoke references on table "public"."referrals" from "anon";

revoke select on table "public"."referrals" from "anon";

revoke trigger on table "public"."referrals" from "anon";

revoke truncate on table "public"."referrals" from "anon";

revoke update on table "public"."referrals" from "anon";

revoke delete on table "public"."referrals" from "authenticated";

revoke insert on table "public"."referrals" from "authenticated";

revoke references on table "public"."referrals" from "authenticated";

revoke select on table "public"."referrals" from "authenticated";

revoke trigger on table "public"."referrals" from "authenticated";

revoke truncate on table "public"."referrals" from "authenticated";

revoke update on table "public"."referrals" from "authenticated";

revoke delete on table "public"."referrals" from "service_role";

revoke insert on table "public"."referrals" from "service_role";

revoke references on table "public"."referrals" from "service_role";

revoke select on table "public"."referrals" from "service_role";

revoke trigger on table "public"."referrals" from "service_role";

revoke truncate on table "public"."referrals" from "service_role";

revoke update on table "public"."referrals" from "service_role";

revoke delete on table "public"."resume_detail_items" from "anon";

revoke insert on table "public"."resume_detail_items" from "anon";

revoke references on table "public"."resume_detail_items" from "anon";

revoke select on table "public"."resume_detail_items" from "anon";

revoke trigger on table "public"."resume_detail_items" from "anon";

revoke truncate on table "public"."resume_detail_items" from "anon";

revoke update on table "public"."resume_detail_items" from "anon";

revoke delete on table "public"."resume_detail_items" from "authenticated";

revoke insert on table "public"."resume_detail_items" from "authenticated";

revoke references on table "public"."resume_detail_items" from "authenticated";

revoke select on table "public"."resume_detail_items" from "authenticated";

revoke trigger on table "public"."resume_detail_items" from "authenticated";

revoke truncate on table "public"."resume_detail_items" from "authenticated";

revoke update on table "public"."resume_detail_items" from "authenticated";

revoke delete on table "public"."resume_detail_items" from "service_role";

revoke insert on table "public"."resume_detail_items" from "service_role";

revoke references on table "public"."resume_detail_items" from "service_role";

revoke select on table "public"."resume_detail_items" from "service_role";

revoke trigger on table "public"."resume_detail_items" from "service_role";

revoke truncate on table "public"."resume_detail_items" from "service_role";

revoke update on table "public"."resume_detail_items" from "service_role";

revoke delete on table "public"."resume_edits" from "anon";

revoke insert on table "public"."resume_edits" from "anon";

revoke references on table "public"."resume_edits" from "anon";

revoke select on table "public"."resume_edits" from "anon";

revoke trigger on table "public"."resume_edits" from "anon";

revoke truncate on table "public"."resume_edits" from "anon";

revoke update on table "public"."resume_edits" from "anon";

revoke delete on table "public"."resume_edits" from "authenticated";

revoke insert on table "public"."resume_edits" from "authenticated";

revoke references on table "public"."resume_edits" from "authenticated";

revoke select on table "public"."resume_edits" from "authenticated";

revoke trigger on table "public"."resume_edits" from "authenticated";

revoke truncate on table "public"."resume_edits" from "authenticated";

revoke update on table "public"."resume_edits" from "authenticated";

revoke delete on table "public"."resume_edits" from "service_role";

revoke insert on table "public"."resume_edits" from "service_role";

revoke references on table "public"."resume_edits" from "service_role";

revoke select on table "public"."resume_edits" from "service_role";

revoke trigger on table "public"."resume_edits" from "service_role";

revoke truncate on table "public"."resume_edits" from "service_role";

revoke update on table "public"."resume_edits" from "service_role";

revoke delete on table "public"."resume_item_descriptions" from "anon";

revoke insert on table "public"."resume_item_descriptions" from "anon";

revoke references on table "public"."resume_item_descriptions" from "anon";

revoke select on table "public"."resume_item_descriptions" from "anon";

revoke trigger on table "public"."resume_item_descriptions" from "anon";

revoke truncate on table "public"."resume_item_descriptions" from "anon";

revoke update on table "public"."resume_item_descriptions" from "anon";

revoke delete on table "public"."resume_item_descriptions" from "authenticated";

revoke insert on table "public"."resume_item_descriptions" from "authenticated";

revoke references on table "public"."resume_item_descriptions" from "authenticated";

revoke select on table "public"."resume_item_descriptions" from "authenticated";

revoke trigger on table "public"."resume_item_descriptions" from "authenticated";

revoke truncate on table "public"."resume_item_descriptions" from "authenticated";

revoke update on table "public"."resume_item_descriptions" from "authenticated";

revoke delete on table "public"."resume_item_descriptions" from "service_role";

revoke insert on table "public"."resume_item_descriptions" from "service_role";

revoke references on table "public"."resume_item_descriptions" from "service_role";

revoke select on table "public"."resume_item_descriptions" from "service_role";

revoke trigger on table "public"."resume_item_descriptions" from "service_role";

revoke truncate on table "public"."resume_item_descriptions" from "service_role";

revoke update on table "public"."resume_item_descriptions" from "service_role";

revoke delete on table "public"."resume_list_items" from "anon";

revoke insert on table "public"."resume_list_items" from "anon";

revoke references on table "public"."resume_list_items" from "anon";

revoke select on table "public"."resume_list_items" from "anon";

revoke trigger on table "public"."resume_list_items" from "anon";

revoke truncate on table "public"."resume_list_items" from "anon";

revoke update on table "public"."resume_list_items" from "anon";

revoke delete on table "public"."resume_list_items" from "authenticated";

revoke insert on table "public"."resume_list_items" from "authenticated";

revoke references on table "public"."resume_list_items" from "authenticated";

revoke select on table "public"."resume_list_items" from "authenticated";

revoke trigger on table "public"."resume_list_items" from "authenticated";

revoke truncate on table "public"."resume_list_items" from "authenticated";

revoke update on table "public"."resume_list_items" from "authenticated";

revoke delete on table "public"."resume_list_items" from "service_role";

revoke insert on table "public"."resume_list_items" from "service_role";

revoke references on table "public"."resume_list_items" from "service_role";

revoke select on table "public"."resume_list_items" from "service_role";

revoke trigger on table "public"."resume_list_items" from "service_role";

revoke truncate on table "public"."resume_list_items" from "service_role";

revoke update on table "public"."resume_list_items" from "service_role";

revoke delete on table "public"."resume_metadata" from "anon";

revoke insert on table "public"."resume_metadata" from "anon";

revoke references on table "public"."resume_metadata" from "anon";

revoke select on table "public"."resume_metadata" from "anon";

revoke trigger on table "public"."resume_metadata" from "anon";

revoke truncate on table "public"."resume_metadata" from "anon";

revoke update on table "public"."resume_metadata" from "anon";

revoke delete on table "public"."resume_metadata" from "authenticated";

revoke insert on table "public"."resume_metadata" from "authenticated";

revoke references on table "public"."resume_metadata" from "authenticated";

revoke select on table "public"."resume_metadata" from "authenticated";

revoke trigger on table "public"."resume_metadata" from "authenticated";

revoke truncate on table "public"."resume_metadata" from "authenticated";

revoke update on table "public"."resume_metadata" from "authenticated";

revoke delete on table "public"."resume_metadata" from "service_role";

revoke insert on table "public"."resume_metadata" from "service_role";

revoke references on table "public"."resume_metadata" from "service_role";

revoke select on table "public"."resume_metadata" from "service_role";

revoke trigger on table "public"."resume_metadata" from "service_role";

revoke truncate on table "public"."resume_metadata" from "service_role";

revoke update on table "public"."resume_metadata" from "service_role";

revoke delete on table "public"."resume_sections" from "anon";

revoke insert on table "public"."resume_sections" from "anon";

revoke references on table "public"."resume_sections" from "anon";

revoke select on table "public"."resume_sections" from "anon";

revoke trigger on table "public"."resume_sections" from "anon";

revoke truncate on table "public"."resume_sections" from "anon";

revoke update on table "public"."resume_sections" from "anon";

revoke delete on table "public"."resume_sections" from "authenticated";

revoke insert on table "public"."resume_sections" from "authenticated";

revoke references on table "public"."resume_sections" from "authenticated";

revoke select on table "public"."resume_sections" from "authenticated";

revoke trigger on table "public"."resume_sections" from "authenticated";

revoke truncate on table "public"."resume_sections" from "authenticated";

revoke update on table "public"."resume_sections" from "authenticated";

revoke delete on table "public"."resume_sections" from "service_role";

revoke insert on table "public"."resume_sections" from "service_role";

revoke references on table "public"."resume_sections" from "service_role";

revoke select on table "public"."resume_sections" from "service_role";

revoke trigger on table "public"."resume_sections" from "service_role";

revoke truncate on table "public"."resume_sections" from "service_role";

revoke update on table "public"."resume_sections" from "service_role";

revoke delete on table "public"."resumes" from "anon";

revoke insert on table "public"."resumes" from "anon";

revoke references on table "public"."resumes" from "anon";

revoke select on table "public"."resumes" from "anon";

revoke trigger on table "public"."resumes" from "anon";

revoke truncate on table "public"."resumes" from "anon";

revoke update on table "public"."resumes" from "anon";

revoke delete on table "public"."resumes" from "authenticated";

revoke insert on table "public"."resumes" from "authenticated";

revoke references on table "public"."resumes" from "authenticated";

revoke select on table "public"."resumes" from "authenticated";

revoke trigger on table "public"."resumes" from "authenticated";

revoke truncate on table "public"."resumes" from "authenticated";

revoke update on table "public"."resumes" from "authenticated";

revoke delete on table "public"."resumes" from "service_role";

revoke insert on table "public"."resumes" from "service_role";

revoke references on table "public"."resumes" from "service_role";

revoke select on table "public"."resumes" from "service_role";

revoke trigger on table "public"."resumes" from "service_role";

revoke truncate on table "public"."resumes" from "service_role";

revoke update on table "public"."resumes" from "service_role";

revoke delete on table "public"."subscriptions" from "anon";

revoke insert on table "public"."subscriptions" from "anon";

revoke references on table "public"."subscriptions" from "anon";

revoke select on table "public"."subscriptions" from "anon";

revoke trigger on table "public"."subscriptions" from "anon";

revoke truncate on table "public"."subscriptions" from "anon";

revoke update on table "public"."subscriptions" from "anon";

revoke delete on table "public"."subscriptions" from "authenticated";

revoke insert on table "public"."subscriptions" from "authenticated";

revoke references on table "public"."subscriptions" from "authenticated";

revoke select on table "public"."subscriptions" from "authenticated";

revoke trigger on table "public"."subscriptions" from "authenticated";

revoke truncate on table "public"."subscriptions" from "authenticated";

revoke update on table "public"."subscriptions" from "authenticated";

revoke delete on table "public"."subscriptions" from "service_role";

revoke insert on table "public"."subscriptions" from "service_role";

revoke references on table "public"."subscriptions" from "service_role";

revoke select on table "public"."subscriptions" from "service_role";

revoke trigger on table "public"."subscriptions" from "service_role";

revoke truncate on table "public"."subscriptions" from "service_role";

revoke update on table "public"."subscriptions" from "service_role";

revoke delete on table "public"."user_coach_access" from "anon";

revoke insert on table "public"."user_coach_access" from "anon";

revoke references on table "public"."user_coach_access" from "anon";

revoke select on table "public"."user_coach_access" from "anon";

revoke trigger on table "public"."user_coach_access" from "anon";

revoke truncate on table "public"."user_coach_access" from "anon";

revoke update on table "public"."user_coach_access" from "anon";

revoke delete on table "public"."user_coach_access" from "authenticated";

revoke insert on table "public"."user_coach_access" from "authenticated";

revoke references on table "public"."user_coach_access" from "authenticated";

revoke select on table "public"."user_coach_access" from "authenticated";

revoke trigger on table "public"."user_coach_access" from "authenticated";

revoke truncate on table "public"."user_coach_access" from "authenticated";

revoke update on table "public"."user_coach_access" from "authenticated";

revoke delete on table "public"."user_coach_access" from "service_role";

revoke insert on table "public"."user_coach_access" from "service_role";

revoke references on table "public"."user_coach_access" from "service_role";

revoke select on table "public"."user_coach_access" from "service_role";

revoke trigger on table "public"."user_coach_access" from "service_role";

revoke truncate on table "public"."user_coach_access" from "service_role";

revoke update on table "public"."user_coach_access" from "service_role";

revoke delete on table "public"."user_files" from "anon";

revoke insert on table "public"."user_files" from "anon";

revoke references on table "public"."user_files" from "anon";

revoke select on table "public"."user_files" from "anon";

revoke trigger on table "public"."user_files" from "anon";

revoke truncate on table "public"."user_files" from "anon";

revoke update on table "public"."user_files" from "anon";

revoke delete on table "public"."user_files" from "authenticated";

revoke insert on table "public"."user_files" from "authenticated";

revoke references on table "public"."user_files" from "authenticated";

revoke select on table "public"."user_files" from "authenticated";

revoke trigger on table "public"."user_files" from "authenticated";

revoke truncate on table "public"."user_files" from "authenticated";

revoke update on table "public"."user_files" from "authenticated";

revoke delete on table "public"."user_files" from "service_role";

revoke insert on table "public"."user_files" from "service_role";

revoke references on table "public"."user_files" from "service_role";

revoke select on table "public"."user_files" from "service_role";

revoke trigger on table "public"."user_files" from "service_role";

revoke truncate on table "public"."user_files" from "service_role";

revoke update on table "public"."user_files" from "service_role";

revoke delete on table "public"."user_knowledge_base" from "anon";

revoke insert on table "public"."user_knowledge_base" from "anon";

revoke references on table "public"."user_knowledge_base" from "anon";

revoke select on table "public"."user_knowledge_base" from "anon";

revoke trigger on table "public"."user_knowledge_base" from "anon";

revoke truncate on table "public"."user_knowledge_base" from "anon";

revoke update on table "public"."user_knowledge_base" from "anon";

revoke delete on table "public"."user_knowledge_base" from "authenticated";

revoke insert on table "public"."user_knowledge_base" from "authenticated";

revoke references on table "public"."user_knowledge_base" from "authenticated";

revoke select on table "public"."user_knowledge_base" from "authenticated";

revoke trigger on table "public"."user_knowledge_base" from "authenticated";

revoke truncate on table "public"."user_knowledge_base" from "authenticated";

revoke update on table "public"."user_knowledge_base" from "authenticated";

revoke delete on table "public"."user_knowledge_base" from "service_role";

revoke insert on table "public"."user_knowledge_base" from "service_role";

revoke references on table "public"."user_knowledge_base" from "service_role";

revoke select on table "public"."user_knowledge_base" from "service_role";

revoke trigger on table "public"."user_knowledge_base" from "service_role";

revoke truncate on table "public"."user_knowledge_base" from "service_role";

revoke update on table "public"."user_knowledge_base" from "service_role";

revoke delete on table "public"."user_knowledge_base_conversations" from "anon";

revoke insert on table "public"."user_knowledge_base_conversations" from "anon";

revoke references on table "public"."user_knowledge_base_conversations" from "anon";

revoke select on table "public"."user_knowledge_base_conversations" from "anon";

revoke trigger on table "public"."user_knowledge_base_conversations" from "anon";

revoke truncate on table "public"."user_knowledge_base_conversations" from "anon";

revoke update on table "public"."user_knowledge_base_conversations" from "anon";

revoke delete on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke insert on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke references on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke select on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke trigger on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke truncate on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke update on table "public"."user_knowledge_base_conversations" from "authenticated";

revoke delete on table "public"."user_knowledge_base_conversations" from "service_role";

revoke insert on table "public"."user_knowledge_base_conversations" from "service_role";

revoke references on table "public"."user_knowledge_base_conversations" from "service_role";

revoke select on table "public"."user_knowledge_base_conversations" from "service_role";

revoke trigger on table "public"."user_knowledge_base_conversations" from "service_role";

revoke truncate on table "public"."user_knowledge_base_conversations" from "service_role";

revoke update on table "public"."user_knowledge_base_conversations" from "service_role";

revoke delete on table "public"."user_knowledge_base_messages" from "anon";

revoke insert on table "public"."user_knowledge_base_messages" from "anon";

revoke references on table "public"."user_knowledge_base_messages" from "anon";

revoke select on table "public"."user_knowledge_base_messages" from "anon";

revoke trigger on table "public"."user_knowledge_base_messages" from "anon";

revoke truncate on table "public"."user_knowledge_base_messages" from "anon";

revoke update on table "public"."user_knowledge_base_messages" from "anon";

revoke delete on table "public"."user_knowledge_base_messages" from "authenticated";

revoke insert on table "public"."user_knowledge_base_messages" from "authenticated";

revoke references on table "public"."user_knowledge_base_messages" from "authenticated";

revoke select on table "public"."user_knowledge_base_messages" from "authenticated";

revoke trigger on table "public"."user_knowledge_base_messages" from "authenticated";

revoke truncate on table "public"."user_knowledge_base_messages" from "authenticated";

revoke update on table "public"."user_knowledge_base_messages" from "authenticated";

revoke delete on table "public"."user_knowledge_base_messages" from "service_role";

revoke insert on table "public"."user_knowledge_base_messages" from "service_role";

revoke references on table "public"."user_knowledge_base_messages" from "service_role";

revoke select on table "public"."user_knowledge_base_messages" from "service_role";

revoke trigger on table "public"."user_knowledge_base_messages" from "service_role";

revoke truncate on table "public"."user_knowledge_base_messages" from "service_role";

revoke update on table "public"."user_knowledge_base_messages" from "service_role";

alter table "public"."coaches" drop constraint "coaches_custom_domain_key";

alter table "public"."coaches" drop constraint "coaches_user_id_fkey";

alter table "public"."coaches" drop constraint "coaches_user_id_key";

alter table "public"."custom_job_categories" drop constraint "custom_job_categories_custom_job_id_fkey";

alter table "public"."custom_job_credits" drop constraint "custom_job_credits_id_fkey";

alter table "public"."custom_job_files" drop constraint "custom_job_files_custom_job_id_fkey";

alter table "public"."custom_job_mock_interview_feedback" drop constraint "custom_job_mock_interview_feedback_mock_interview_id_fkey";

alter table "public"."custom_job_mock_interviews" drop constraint "custom_job_mock_interviews_custom_job_id_fkey";

alter table "public"."custom_job_question_submissions" drop constraint "custom_job_question_submissions_custom_job_question_id_fkey";

alter table "public"."custom_job_questions" drop constraint "custom_job_questions_custom_job_id_fkey";

alter table "public"."custom_jobs" drop constraint "custom_job_user_id_fkey";

alter table "public"."custom_jobs" drop constraint "custom_jobs_coach_id_fkey";

alter table "public"."demo_job_questions" drop constraint "demo_custom_job_questions_custom_job_id_fkey";

alter table "public"."interview_copilot_files" drop constraint "interview_copilot_files_interview_copilot_id_fkey";

alter table "public"."interview_copilot_questions_and_answers" drop constraint "interview_copilot_questions_and_answe_interview_copilot_id_fkey";

alter table "public"."interview_copilots" drop constraint "interview_copilot_session_user_id_fkey";

alter table "public"."mock_interview_messages" drop constraint "mock_interview_messages_mock_interview_id_fkey";

alter table "public"."mock_interview_question_feedback" drop constraint "mock_interview_question_feedback_mock_interview_id_fkey";

alter table "public"."referral_codes" drop constraint "referral_codes_user_id_fkey";

alter table "public"."referral_codes" drop constraint "referral_codes_user_id_key";

alter table "public"."referral_redemptions" drop constraint "referral_redemptions_id_fkey";

alter table "public"."referrals" drop constraint "referrals_id_fkey";

alter table "public"."referrals" drop constraint "referrals_referral_code_id_fkey";

alter table "public"."resume_detail_items" drop constraint "resume_detail_items_section_id_fkey";

alter table "public"."resume_edits" drop constraint "resume_edits_resume_id_fkey";

alter table "public"."resume_item_descriptions" drop constraint "resume_item_descriptions_detail_item_id_fkey";

alter table "public"."resume_list_items" drop constraint "resume_list_items_section_id_fkey";

alter table "public"."resume_metadata" drop constraint "resume_metadata_demo_job_id_fkey";

alter table "public"."resume_metadata" drop constraint "resume_metadata_resume_id_fkey";

alter table "public"."resume_metadata" drop constraint "resume_metadata_slug_key";

alter table "public"."resume_sections" drop constraint "resume_sections_resume_id_fkey";

alter table "public"."resumes" drop constraint "resumes_user_id_fkey";

alter table "public"."subscriptions" drop constraint "subscriptions_id_fkey";

alter table "public"."subscriptions" drop constraint "subscriptions_stripe_customer_id_key";

alter table "public"."user_coach_access" drop constraint "user_coach_access_coach_id_fkey";

alter table "public"."user_coach_access" drop constraint "user_coach_access_user_id_fkey";

alter table "public"."user_files" drop constraint "user_files_user_id_fkey";

alter table "public"."user_knowledge_base" drop constraint "user_knowledge_base_user_id_fkey";

alter table "public"."user_knowledge_base_conversations" drop constraint "user_info_conversations_user_id_fkey";

alter table "public"."user_knowledge_base_messages" drop constraint "user_info_messages_conversation_id_fkey";

alter table "public"."user_knowledge_base_messages" drop constraint "user_knowledge_base_messages_id2_key";

alter table "public"."coaches" drop constraint "coaches_pkey";

alter table "public"."custom_job_categories" drop constraint "custom_job_categories_pkey";

alter table "public"."custom_job_credits" drop constraint "custom_job_credits_pkey";

alter table "public"."custom_job_files" drop constraint "custom_job_files_pkey";

alter table "public"."custom_job_mock_interview_feedback" drop constraint "custom_job_mock_interview_feedback_pkey";

alter table "public"."custom_job_mock_interviews" drop constraint "custom_job_mock_interviews_pkey";

alter table "public"."custom_job_question_submissions" drop constraint "custom_job_question_submissions_pkey";

alter table "public"."custom_job_questions" drop constraint "custom_job_questions_pkey";

alter table "public"."custom_jobs" drop constraint "custom_job_pkey";

alter table "public"."demo_job_questions" drop constraint "demo_custom_job_questions_pkey";

alter table "public"."demo_jobs" drop constraint "demo_custom_jobs_pkey";

alter table "public"."email_waitlist" drop constraint "email_waitlist_pkey";

alter table "public"."interview_copilot_demo_files" drop constraint "interview_copilot_demo_files_pkey";

alter table "public"."interview_copilot_files" drop constraint "interview_copilot_files_pkey";

alter table "public"."interview_copilot_questions_and_answers" drop constraint "interview_copilot_questions_and_answers_pkey";

alter table "public"."interview_copilots" drop constraint "interview_copilot_session_pkey";

alter table "public"."mock_interview_messages" drop constraint "mock_interview_messages_pkey";

alter table "public"."mock_interview_question_feedback" drop constraint "mock_interview_question_feedback_pkey";

alter table "public"."referral_codes" drop constraint "referral_codes_pkey";

alter table "public"."referral_redemptions" drop constraint "referral_redemptions_pkey";

alter table "public"."referrals" drop constraint "referrals_pkey";

alter table "public"."resume_detail_items" drop constraint "resume_detail_items_pkey";

alter table "public"."resume_edits" drop constraint "resume_edits_pkey";

alter table "public"."resume_item_descriptions" drop constraint "resume_item_descriptions_pkey";

alter table "public"."resume_list_items" drop constraint "resume_list_items_pkey";

alter table "public"."resume_metadata" drop constraint "resume_metadata_pkey";

alter table "public"."resume_sections" drop constraint "resume_sections_pkey";

alter table "public"."resumes" drop constraint "resumes_pkey";

alter table "public"."subscriptions" drop constraint "subscriptions_pkey";

alter table "public"."user_coach_access" drop constraint "user_coach_access_pkey";

alter table "public"."user_files" drop constraint "user_files_pkey";

alter table "public"."user_knowledge_base" drop constraint "user_knowledge_base_pkey";

alter table "public"."user_knowledge_base_conversations" drop constraint "user_info_conversations_pkey";

alter table "public"."user_knowledge_base_messages" drop constraint "user_knowledge_base_messages_pkey";

drop index if exists "public"."coaches_custom_domain_key";

drop index if exists "public"."coaches_pkey";

drop index if exists "public"."coaches_user_id_key";

drop index if exists "public"."custom_job_categories_pkey";

drop index if exists "public"."custom_job_credits_pkey";

drop index if exists "public"."custom_job_files_pkey";

drop index if exists "public"."custom_job_mock_interview_feedback_pkey";

drop index if exists "public"."custom_job_mock_interviews_pkey";

drop index if exists "public"."custom_job_pkey";

drop index if exists "public"."custom_job_question_submissions_pkey";

drop index if exists "public"."custom_job_questions_pkey";

drop index if exists "public"."demo_custom_job_questions_pkey";

drop index if exists "public"."demo_custom_jobs_pkey";

drop index if exists "public"."email_waitlist_pkey";

drop index if exists "public"."idx_resume_detail_items_section_id";

drop index if exists "public"."idx_resume_item_descriptions_detail_item_id";

drop index if exists "public"."idx_resume_list_items_section_id";

drop index if exists "public"."idx_resume_sections_resume_id";

drop index if exists "public"."idx_resumes_user_id";

drop index if exists "public"."interview_copilot_demo_files_pkey";

drop index if exists "public"."interview_copilot_files_pkey";

drop index if exists "public"."interview_copilot_questions_and_answers_pkey";

drop index if exists "public"."interview_copilot_session_pkey";

drop index if exists "public"."mock_interview_messages_pkey";

drop index if exists "public"."mock_interview_question_feedback_pkey";

drop index if exists "public"."referral_codes_pkey";

drop index if exists "public"."referral_codes_user_id_key";

drop index if exists "public"."referral_redemptions_pkey";

drop index if exists "public"."referrals_pkey";

drop index if exists "public"."resume_detail_items_pkey";

drop index if exists "public"."resume_edits_pkey";

drop index if exists "public"."resume_item_descriptions_pkey";

drop index if exists "public"."resume_list_items_pkey";

drop index if exists "public"."resume_metadata_pkey";

drop index if exists "public"."resume_metadata_slug_key";

drop index if exists "public"."resume_sections_pkey";

drop index if exists "public"."resumes_pkey";

drop index if exists "public"."subscriptions_pkey";

drop index if exists "public"."subscriptions_stripe_customer_id_key";

drop index if exists "public"."user_coach_access_pkey";

drop index if exists "public"."user_files_pkey";

drop index if exists "public"."user_info_conversations_pkey";

drop index if exists "public"."user_knowledge_base_messages_id2_key";

drop index if exists "public"."user_knowledge_base_messages_pkey";

drop index if exists "public"."user_knowledge_base_pkey";

drop table "public"."coaches";

drop table "public"."custom_job_categories";

drop table "public"."custom_job_credits";

drop table "public"."custom_job_files";

drop table "public"."custom_job_mock_interview_feedback";

drop table "public"."custom_job_mock_interviews";

drop table "public"."custom_job_question_submissions";

drop table "public"."custom_job_questions";

drop table "public"."custom_jobs";

drop table "public"."demo_job_questions";

drop table "public"."demo_jobs";

drop table "public"."email_waitlist";

drop table "public"."interview_copilot_demo_files";

drop table "public"."interview_copilot_files";

drop table "public"."interview_copilot_questions_and_answers";

drop table "public"."interview_copilots";

drop table "public"."mock_interview_messages";

drop table "public"."mock_interview_question_feedback";

drop table "public"."referral_codes";

drop table "public"."referral_redemptions";

drop table "public"."referrals";

drop table "public"."resume_detail_items";

drop table "public"."resume_edits";

drop table "public"."resume_item_descriptions";

drop table "public"."resume_list_items";

drop table "public"."resume_metadata";

drop table "public"."resume_sections";

drop table "public"."resumes";

drop table "public"."subscriptions";

drop table "public"."user_coach_access";

drop table "public"."user_files";

drop table "public"."user_knowledge_base";

drop table "public"."user_knowledge_base_conversations";

drop table "public"."user_knowledge_base_messages";

drop type "public"."custom_job_access";

drop type "public"."deletion_status";

drop type "public"."interview_copilot_access";

drop type "public"."interview_copilot_status";

drop type "public"."interview_status";

drop type "public"."locked_status";

drop type "public"."message_role";

drop type "public"."question_type";


