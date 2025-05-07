

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."custom_job_access" AS ENUM (
    'locked',
    'unlocked'
);


ALTER TYPE "public"."custom_job_access" OWNER TO "postgres";


CREATE TYPE "public"."deletion_status" AS ENUM (
    'deleted',
    'not_deleted'
);


ALTER TYPE "public"."deletion_status" OWNER TO "postgres";


CREATE TYPE "public"."interview_copilot_access" AS ENUM (
    'locked',
    'unlocked'
);


ALTER TYPE "public"."interview_copilot_access" OWNER TO "postgres";


CREATE TYPE "public"."interview_copilot_status" AS ENUM (
    'in_progress',
    'complete'
);


ALTER TYPE "public"."interview_copilot_status" OWNER TO "postgres";


CREATE TYPE "public"."interview_status" AS ENUM (
    'in_progress',
    'complete'
);


ALTER TYPE "public"."interview_status" OWNER TO "postgres";


CREATE TYPE "public"."locked_status" AS ENUM (
    'locked',
    'unlocked'
);


ALTER TYPE "public"."locked_status" OWNER TO "postgres";


CREATE TYPE "public"."message_role" AS ENUM (
    'user',
    'model'
);


ALTER TYPE "public"."message_role" OWNER TO "postgres";


CREATE TYPE "public"."question_type" AS ENUM (
    'ai_generated',
    'user_generated'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."custom_job_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_job_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "job_title" "text" NOT NULL
);


ALTER TABLE "public"."custom_job_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_job_credits" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "number_of_credits" numeric NOT NULL
);


ALTER TABLE "public"."custom_job_credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_job_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_job_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "google_file_uri" "text" NOT NULL,
    "google_file_name" "text" NOT NULL
);


ALTER TABLE "public"."custom_job_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_job_mock_interview_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mock_interview_id" "uuid",
    "overview" "text" NOT NULL,
    "pros" "text"[] NOT NULL,
    "cons" "text"[] NOT NULL,
    "job_fit_analysis" "text" NOT NULL,
    "job_fit_percentage" numeric NOT NULL,
    "score" numeric NOT NULL,
    "key_improvements" "text"[] NOT NULL,
    "input_token_count" numeric NOT NULL,
    "output_token_count" numeric NOT NULL
);


ALTER TABLE "public"."custom_job_mock_interview_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_job_mock_interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_job_id" "uuid" NOT NULL,
    "recording_file_path" "text",
    "interview_prompt" "text" NOT NULL,
    "status" "public"."interview_status" NOT NULL
);


ALTER TABLE "public"."custom_job_mock_interviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_job_question_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_job_question_id" "uuid" NOT NULL,
    "answer" "text" NOT NULL,
    "feedback" "json"
);


ALTER TABLE "public"."custom_job_question_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_job_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question" "text" NOT NULL,
    "answer_guidelines" "text" NOT NULL,
    "custom_job_id" "uuid" NOT NULL,
    "question_type" "public"."question_type" DEFAULT 'ai_generated'::"public"."question_type" NOT NULL
);


ALTER TABLE "public"."custom_job_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_title" "text" NOT NULL,
    "job_description" "text" NOT NULL,
    "company_name" "text",
    "company_description" "text",
    "status" "public"."custom_job_access" NOT NULL
);


ALTER TABLE "public"."custom_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_job_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question" "text" NOT NULL,
    "answer_guidelines" "text" NOT NULL,
    "custom_job_id" "uuid" NOT NULL,
    "good_answers" "text"[]
);


ALTER TABLE "public"."demo_job_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demo_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_title" "text" NOT NULL,
    "job_description" "text" NOT NULL,
    "company_name" "text",
    "company_description" "text",
    "slug" "text"
);


ALTER TABLE "public"."demo_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."email_waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_copilot_demo_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "file_path" "text" NOT NULL,
    "google_file_name" "text" NOT NULL,
    "google_file_mime_type" "text" NOT NULL
);


ALTER TABLE "public"."interview_copilot_demo_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_copilot_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interview_copilot_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "google_file_uri" "text" NOT NULL,
    "google_file_name" "text" NOT NULL
);


ALTER TABLE "public"."interview_copilot_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_copilot_questions_and_answers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interview_copilot_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL
);


ALTER TABLE "public"."interview_copilot_questions_and_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_copilots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "transcript" "text" NOT NULL,
    "input_tokens_count" numeric NOT NULL,
    "output_tokens_count" numeric NOT NULL,
    "duration_ms" numeric NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_title" "text",
    "job_description" "text",
    "company_name" "text",
    "company_description" "text",
    "title" "text" NOT NULL,
    "status" "public"."interview_status" NOT NULL,
    "file_path" "text",
    "deletion_status" "public"."deletion_status" NOT NULL,
    "interview_copilot_access" "public"."interview_copilot_access" NOT NULL
);


ALTER TABLE "public"."interview_copilots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mock_interview_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mock_interview_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "role" "public"."message_role" NOT NULL
);


ALTER TABLE "public"."mock_interview_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mock_interview_question_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "pros" "text"[] NOT NULL,
    "cons" "text"[] NOT NULL,
    "score" numeric NOT NULL,
    "mock_interview_id" "uuid" NOT NULL
);


ALTER TABLE "public"."mock_interview_question_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "referral_redemption_count" numeric NOT NULL
);


ALTER TABLE "public"."referral_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "referral_code_id" "uuid" NOT NULL
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_detail_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "date_range" "text",
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_detail_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_edits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resume_id" "uuid" NOT NULL
);


ALTER TABLE "public"."resume_edits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_item_descriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "detail_item_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_item_descriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_list_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "company_name" "text",
    "company_description" "text",
    "job_title" "text" NOT NULL,
    "job_description" "text" NOT NULL,
    "slug" "text",
    "important_skills" "text"[],
    "important_work_experience" "text"[],
    "demo_job_id" "uuid"
);


ALTER TABLE "public"."resume_metadata" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_sections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "resume_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resumes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "location" "text",
    "summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "locked_status" "public"."locked_status" NOT NULL
);


ALTER TABLE "public"."resumes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stripe_customer_id" "text" NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bucket_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "google_file_uri" "text" NOT NULL,
    "google_file_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "added_to_memory" boolean NOT NULL
);


ALTER TABLE "public"."user_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_knowledge_base" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "knowledge_base" "text" NOT NULL
);


ALTER TABLE "public"."user_knowledge_base" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_knowledge_base_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_knowledge_base_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_knowledge_base_messages" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message" "text" NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "public"."message_role" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."user_knowledge_base_messages" OWNER TO "postgres";


ALTER TABLE ONLY "public"."custom_job_categories"
    ADD CONSTRAINT "custom_job_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_job_credits"
    ADD CONSTRAINT "custom_job_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_job_files"
    ADD CONSTRAINT "custom_job_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_job_mock_interview_feedback"
    ADD CONSTRAINT "custom_job_mock_interview_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_job_mock_interviews"
    ADD CONSTRAINT "custom_job_mock_interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_jobs"
    ADD CONSTRAINT "custom_job_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_job_question_submissions"
    ADD CONSTRAINT "custom_job_question_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_job_questions"
    ADD CONSTRAINT "custom_job_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_job_questions"
    ADD CONSTRAINT "demo_custom_job_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demo_jobs"
    ADD CONSTRAINT "demo_custom_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_waitlist"
    ADD CONSTRAINT "email_waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_copilot_demo_files"
    ADD CONSTRAINT "interview_copilot_demo_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_copilot_files"
    ADD CONSTRAINT "interview_copilot_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_copilot_questions_and_answers"
    ADD CONSTRAINT "interview_copilot_questions_and_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_copilots"
    ADD CONSTRAINT "interview_copilot_session_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mock_interview_messages"
    ADD CONSTRAINT "mock_interview_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mock_interview_question_feedback"
    ADD CONSTRAINT "mock_interview_question_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."referral_redemptions"
    ADD CONSTRAINT "referral_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_detail_items"
    ADD CONSTRAINT "resume_detail_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_edits"
    ADD CONSTRAINT "resume_edits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_item_descriptions"
    ADD CONSTRAINT "resume_item_descriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_list_items"
    ADD CONSTRAINT "resume_list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_metadata"
    ADD CONSTRAINT "resume_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_metadata"
    ADD CONSTRAINT "resume_metadata_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."resume_sections"
    ADD CONSTRAINT "resume_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."user_files"
    ADD CONSTRAINT "user_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_knowledge_base_conversations"
    ADD CONSTRAINT "user_info_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_knowledge_base_messages"
    ADD CONSTRAINT "user_knowledge_base_messages_id2_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."user_knowledge_base_messages"
    ADD CONSTRAINT "user_knowledge_base_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_knowledge_base"
    ADD CONSTRAINT "user_knowledge_base_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_resume_detail_items_section_id" ON "public"."resume_detail_items" USING "btree" ("section_id");



CREATE INDEX "idx_resume_item_descriptions_detail_item_id" ON "public"."resume_item_descriptions" USING "btree" ("detail_item_id");



CREATE INDEX "idx_resume_list_items_section_id" ON "public"."resume_list_items" USING "btree" ("section_id");



CREATE INDEX "idx_resume_sections_resume_id" ON "public"."resume_sections" USING "btree" ("resume_id");



CREATE INDEX "idx_resumes_user_id" ON "public"."resumes" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "New job " AFTER INSERT ON "public"."custom_jobs" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://www.perfectinterview.ai/api/webhooks/supabase/new-custoom-job', 'POST', '{"Content-type":"application/json","authorization":"Bearer AnCJ789rcEzFVF2npAogMVyq6OXdnCcY"}', '{}', '10000');



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."resumes" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "new-referral" AFTER INSERT ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://www.perfectinterview.ai/api/webhooks/supabase/referrals', 'POST', '{"Content-type":"application/json","authorization":"Bearer AnCJ789rcEzFVF2npAogMVyq6OXdnCcY"}', '{}', '10000');



ALTER TABLE ONLY "public"."custom_job_categories"
    ADD CONSTRAINT "custom_job_categories_custom_job_id_fkey" FOREIGN KEY ("custom_job_id") REFERENCES "public"."custom_jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_job_credits"
    ADD CONSTRAINT "custom_job_credits_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_job_files"
    ADD CONSTRAINT "custom_job_files_custom_job_id_fkey" FOREIGN KEY ("custom_job_id") REFERENCES "public"."custom_jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_job_mock_interview_feedback"
    ADD CONSTRAINT "custom_job_mock_interview_feedback_mock_interview_id_fkey" FOREIGN KEY ("mock_interview_id") REFERENCES "public"."custom_job_mock_interviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_job_mock_interviews"
    ADD CONSTRAINT "custom_job_mock_interviews_custom_job_id_fkey" FOREIGN KEY ("custom_job_id") REFERENCES "public"."custom_jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_job_question_submissions"
    ADD CONSTRAINT "custom_job_question_submissions_custom_job_question_id_fkey" FOREIGN KEY ("custom_job_question_id") REFERENCES "public"."custom_job_questions"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_job_questions"
    ADD CONSTRAINT "custom_job_questions_custom_job_id_fkey" FOREIGN KEY ("custom_job_id") REFERENCES "public"."custom_jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_jobs"
    ADD CONSTRAINT "custom_job_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."demo_job_questions"
    ADD CONSTRAINT "demo_custom_job_questions_custom_job_id_fkey" FOREIGN KEY ("custom_job_id") REFERENCES "public"."demo_jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_copilot_files"
    ADD CONSTRAINT "interview_copilot_files_interview_copilot_id_fkey" FOREIGN KEY ("interview_copilot_id") REFERENCES "public"."interview_copilots"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_copilot_questions_and_answers"
    ADD CONSTRAINT "interview_copilot_questions_and_answe_interview_copilot_id_fkey" FOREIGN KEY ("interview_copilot_id") REFERENCES "public"."interview_copilots"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_copilots"
    ADD CONSTRAINT "interview_copilot_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mock_interview_messages"
    ADD CONSTRAINT "mock_interview_messages_mock_interview_id_fkey" FOREIGN KEY ("mock_interview_id") REFERENCES "public"."custom_job_mock_interviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mock_interview_question_feedback"
    ADD CONSTRAINT "mock_interview_question_feedback_mock_interview_id_fkey" FOREIGN KEY ("mock_interview_id") REFERENCES "public"."custom_job_mock_interviews"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_redemptions"
    ADD CONSTRAINT "referral_redemptions_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referral_code_id_fkey" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_detail_items"
    ADD CONSTRAINT "resume_detail_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."resume_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_edits"
    ADD CONSTRAINT "resume_edits_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_item_descriptions"
    ADD CONSTRAINT "resume_item_descriptions_detail_item_id_fkey" FOREIGN KEY ("detail_item_id") REFERENCES "public"."resume_detail_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_list_items"
    ADD CONSTRAINT "resume_list_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."resume_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_metadata"
    ADD CONSTRAINT "resume_metadata_demo_job_id_fkey" FOREIGN KEY ("demo_job_id") REFERENCES "public"."demo_jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_metadata"
    ADD CONSTRAINT "resume_metadata_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume_sections"
    ADD CONSTRAINT "resume_sections_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resumes"
    ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_files"
    ADD CONSTRAINT "user_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_knowledge_base_conversations"
    ADD CONSTRAINT "user_info_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_knowledge_base_messages"
    ADD CONSTRAINT "user_info_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."user_knowledge_base_conversations"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_knowledge_base"
    ADD CONSTRAINT "user_knowledge_base_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Access resume detail items through sections" ON "public"."resume_detail_items" USING (("section_id" IN ( SELECT "resume_sections"."id"
   FROM "public"."resume_sections"
  WHERE ("resume_sections"."resume_id" IN ( SELECT "resumes"."id"
           FROM "public"."resumes")))));



CREATE POLICY "Access resume item descriptions through detail items" ON "public"."resume_item_descriptions" USING (("detail_item_id" IN ( SELECT "resume_detail_items"."id"
   FROM "public"."resume_detail_items"
  WHERE ("resume_detail_items"."section_id" IN ( SELECT "resume_sections"."id"
           FROM "public"."resume_sections"
          WHERE ("resume_sections"."resume_id" IN ( SELECT "resumes"."id"
                   FROM "public"."resumes")))))));



CREATE POLICY "Access resume list items through sections" ON "public"."resume_list_items" USING (("section_id" IN ( SELECT "resume_sections"."id"
   FROM "public"."resume_sections"
  WHERE ("resume_sections"."resume_id" IN ( SELECT "resumes"."id"
           FROM "public"."resumes")))));



CREATE POLICY "Access resume sections through resumes" ON "public"."resume_sections" USING (("resume_id" IN ( SELECT "resumes"."id"
   FROM "public"."resumes")));



CREATE POLICY "Allow admins read access" ON "public"."interview_copilots" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow all for users based on resume access" ON "public"."resume_edits" TO "authenticated" USING (("resume_id" IN ( SELECT "resumes"."id"
   FROM "public"."resumes"))) WITH CHECK (("resume_id" IN ( SELECT "resumes"."id"
   FROM "public"."resumes")));



CREATE POLICY "Allow delete access to custom_job_files for users with access t" ON "public"."custom_job_files" FOR DELETE TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow delete access to custom_job_mock_interview_feedback for u" ON "public"."custom_job_mock_interview_feedback" FOR DELETE TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow delete access to custom_job_mock_interviews for users wit" ON "public"."custom_job_mock_interviews" FOR DELETE TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow delete access to custom_job_question_submissions for user" ON "public"."custom_job_question_submissions" FOR DELETE TO "authenticated" USING (("custom_job_question_id" IN ( SELECT "custom_job_questions"."id"
   FROM "public"."custom_job_questions"
  WHERE ("custom_job_questions"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow delete access to custom_job_questions for users with acce" ON "public"."custom_job_questions" FOR DELETE TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow delete access to interview_copilot_questions_and_answers " ON "public"."interview_copilot_questions_and_answers" FOR DELETE TO "authenticated" USING (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow delete access to mock_interview_messages for users with a" ON "public"."mock_interview_messages" FOR DELETE TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow delete access to mock_interview_question_feedback for use" ON "public"."mock_interview_question_feedback" FOR DELETE TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow delete access to user_knowledge_base_messages for users w" ON "public"."user_knowledge_base_messages" FOR DELETE TO "authenticated" USING (("conversation_id" IN ( SELECT "user_knowledge_base_conversations"."id"
   FROM "public"."user_knowledge_base_conversations"
  WHERE ("user_knowledge_base_conversations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow insert access to custom_job_files for users with access t" ON "public"."custom_job_files" FOR INSERT TO "authenticated" WITH CHECK (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow insert access to custom_job_mock_interview_feedback for u" ON "public"."custom_job_mock_interview_feedback" FOR INSERT TO "authenticated" WITH CHECK (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow insert access to custom_job_mock_interviews for users wit" ON "public"."custom_job_mock_interviews" FOR INSERT TO "authenticated" WITH CHECK (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow insert access to custom_job_question_submissions for user" ON "public"."custom_job_question_submissions" FOR INSERT TO "authenticated" WITH CHECK (("custom_job_question_id" IN ( SELECT "custom_job_questions"."id"
   FROM "public"."custom_job_questions"
  WHERE ("custom_job_questions"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow insert access to custom_job_questions for users with acce" ON "public"."custom_job_questions" FOR INSERT TO "authenticated" WITH CHECK (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow insert access to interview_copilot_questions_and_answers " ON "public"."interview_copilot_questions_and_answers" FOR INSERT TO "authenticated" WITH CHECK (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow insert access to mock_interview_messages for users with a" ON "public"."mock_interview_messages" FOR INSERT TO "authenticated" WITH CHECK (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow insert access to mock_interview_question_feedback for use" ON "public"."mock_interview_question_feedback" FOR INSERT TO "authenticated" WITH CHECK (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow insert access to user_knowledge_base_messages for users w" ON "public"."user_knowledge_base_messages" FOR INSERT TO "authenticated" WITH CHECK (("conversation_id" IN ( SELECT "user_knowledge_base_conversations"."id"
   FROM "public"."user_knowledge_base_conversations"
  WHERE ("user_knowledge_base_conversations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow select access to custom_job_files for users with access t" ON "public"."custom_job_files" FOR SELECT TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow select access to custom_job_mock_interview_feedback for a" ON "public"."custom_job_mock_interview_feedback" FOR SELECT TO "authenticated" USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow select access to custom_job_mock_interview_feedback for u" ON "public"."custom_job_mock_interview_feedback" FOR SELECT TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow select access to custom_job_mock_interviews for users wit" ON "public"."custom_job_mock_interviews" FOR SELECT TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow select access to custom_job_question_submissions for user" ON "public"."custom_job_question_submissions" FOR SELECT TO "authenticated" USING (("custom_job_question_id" IN ( SELECT "custom_job_questions"."id"
   FROM "public"."custom_job_questions"
  WHERE ("custom_job_questions"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow select access to custom_job_questions for users with acce" ON "public"."custom_job_questions" FOR SELECT TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow select access to demo resume" ON "public"."resumes" FOR SELECT USING ((("id" = '4cbdd2c8-a96b-4d3c-bd32-d9b89d924153'::"uuid") OR ("id" = '0d4a08c1-4054-4c45-b12f-500081499cad'::"uuid") OR ("user_id" = '7823eb9a-62fc-4bbf-bd58-488f117c24e8'::"uuid")));



CREATE POLICY "Allow select access to interview_copilot_questions_and_answers " ON "public"."interview_copilot_questions_and_answers" FOR SELECT TO "authenticated" USING (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow select access to mock_interview_messages for users with a" ON "public"."mock_interview_messages" FOR SELECT TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow select access to mock_interview_question_feedback for use" ON "public"."mock_interview_question_feedback" FOR SELECT TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow select access to resumes for admins" ON "public"."resumes" FOR SELECT TO "authenticated" USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "is_admin") = true));



CREATE POLICY "Allow select access to user_knowledge_base_messages for users w" ON "public"."user_knowledge_base_messages" FOR SELECT TO "authenticated" USING (("conversation_id" IN ( SELECT "user_knowledge_base_conversations"."id"
   FROM "public"."user_knowledge_base_conversations"
  WHERE ("user_knowledge_base_conversations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow select for admins" ON "public"."custom_job_mock_interviews" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow select for admins" ON "public"."custom_job_question_submissions" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow select for admins" ON "public"."custom_job_questions" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow select for admins" ON "public"."custom_jobs" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow select for admins" ON "public"."mock_interview_messages" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow select for admins" ON "public"."mock_interview_question_feedback" FOR SELECT USING ((( SELECT ((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'is_admin'::"text"))::boolean AS "bool") = true));



CREATE POLICY "Allow update access to custom_job_files for users with access t" ON "public"."custom_job_files" FOR UPDATE TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow update access to custom_job_mock_interview_feedback for u" ON "public"."custom_job_mock_interview_feedback" FOR UPDATE TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow update access to custom_job_mock_interviews for users wit" ON "public"."custom_job_mock_interviews" FOR UPDATE TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow update access to custom_job_question_submissions for user" ON "public"."custom_job_question_submissions" FOR UPDATE TO "authenticated" USING (("custom_job_question_id" IN ( SELECT "custom_job_questions"."id"
   FROM "public"."custom_job_questions"
  WHERE ("custom_job_questions"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK (("custom_job_question_id" IN ( SELECT "custom_job_questions"."id"
   FROM "public"."custom_job_questions"
  WHERE ("custom_job_questions"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow update access to custom_job_questions for users with acce" ON "public"."custom_job_questions" FOR UPDATE TO "authenticated" USING (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("custom_job_id" IN ( SELECT "custom_jobs"."id"
   FROM "public"."custom_jobs"
  WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow update access to interview_copilot_questions_and_answers " ON "public"."interview_copilot_questions_and_answers" FOR UPDATE TO "authenticated" USING (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Allow update access to mock_interview_messages for users with a" ON "public"."mock_interview_messages" FOR UPDATE TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow update access to mock_interview_question_feedback for use" ON "public"."mock_interview_question_feedback" FOR UPDATE TO "authenticated" USING (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))))) WITH CHECK (("mock_interview_id" IN ( SELECT "custom_job_mock_interviews"."id"
   FROM "public"."custom_job_mock_interviews"
  WHERE ("custom_job_mock_interviews"."custom_job_id" IN ( SELECT "custom_jobs"."id"
           FROM "public"."custom_jobs"
          WHERE ("custom_jobs"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "Allow update access to user_knowledge_base_messages for users w" ON "public"."user_knowledge_base_messages" FOR UPDATE TO "authenticated" USING (("conversation_id" IN ( SELECT "user_knowledge_base_conversations"."id"
   FROM "public"."user_knowledge_base_conversations"
  WHERE ("user_knowledge_base_conversations"."user_id" = "auth"."uid"())))) WITH CHECK (("conversation_id" IN ( SELECT "user_knowledge_base_conversations"."id"
   FROM "public"."user_knowledge_base_conversations"
  WHERE ("user_knowledge_base_conversations"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable all for users based on user_id" ON "public"."custom_job_credits" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."custom_jobs" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."interview_copilots" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."referral_codes" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."referral_redemptions" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."referrals" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."user_files" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."user_knowledge_base" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable all for users based on user_id" ON "public"."user_knowledge_base_conversations" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable all for users if they have access to parent copilot" ON "public"."interview_copilot_files" TO "authenticated" USING (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("interview_copilot_id" IN ( SELECT "interview_copilots"."id"
   FROM "public"."interview_copilots"
  WHERE ("interview_copilots"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Enable insert access for all users" ON "public"."email_waitlist" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert access for all users" ON "public"."interview_copilot_demo_files" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."demo_job_questions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."demo_jobs" FOR SELECT USING (true);



CREATE POLICY "Enable select access if they have access to parent resume" ON "public"."resume_metadata" FOR SELECT USING (("resume_id" IN ( SELECT "resumes"."id"
   FROM "public"."resumes")));



CREATE POLICY "Enable select for users based on id" ON "public"."subscriptions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can only access their own resumes" ON "public"."resumes" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."custom_job_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_job_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_job_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_job_mock_interview_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_job_mock_interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_job_question_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_job_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demo_job_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demo_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_copilot_demo_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_copilot_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_copilot_questions_and_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_copilots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mock_interview_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mock_interview_question_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_detail_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_edits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_item_descriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resumes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_knowledge_base" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_knowledge_base_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_knowledge_base_messages" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






































































































































































































GRANT ALL ON TABLE "public"."custom_job_categories" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_categories" TO "service_role";



GRANT ALL ON TABLE "public"."custom_job_credits" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_credits" TO "service_role";



GRANT ALL ON TABLE "public"."custom_job_files" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_files" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_files" TO "service_role";



GRANT ALL ON TABLE "public"."custom_job_mock_interview_feedback" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_mock_interview_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_mock_interview_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."custom_job_mock_interviews" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_mock_interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_mock_interviews" TO "service_role";



GRANT ALL ON TABLE "public"."custom_job_question_submissions" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_question_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_question_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."custom_job_questions" TO "anon";
GRANT ALL ON TABLE "public"."custom_job_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_job_questions" TO "service_role";



GRANT ALL ON TABLE "public"."custom_jobs" TO "anon";
GRANT ALL ON TABLE "public"."custom_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."demo_job_questions" TO "anon";
GRANT ALL ON TABLE "public"."demo_job_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_job_questions" TO "service_role";



GRANT ALL ON TABLE "public"."demo_jobs" TO "anon";
GRANT ALL ON TABLE "public"."demo_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."demo_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."email_waitlist" TO "anon";
GRANT ALL ON TABLE "public"."email_waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."email_waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."interview_copilot_demo_files" TO "anon";
GRANT ALL ON TABLE "public"."interview_copilot_demo_files" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_copilot_demo_files" TO "service_role";



GRANT ALL ON TABLE "public"."interview_copilot_files" TO "anon";
GRANT ALL ON TABLE "public"."interview_copilot_files" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_copilot_files" TO "service_role";



GRANT ALL ON TABLE "public"."interview_copilot_questions_and_answers" TO "anon";
GRANT ALL ON TABLE "public"."interview_copilot_questions_and_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_copilot_questions_and_answers" TO "service_role";



GRANT ALL ON TABLE "public"."interview_copilots" TO "anon";
GRANT ALL ON TABLE "public"."interview_copilots" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_copilots" TO "service_role";



GRANT ALL ON TABLE "public"."mock_interview_messages" TO "anon";
GRANT ALL ON TABLE "public"."mock_interview_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."mock_interview_messages" TO "service_role";



GRANT ALL ON TABLE "public"."mock_interview_question_feedback" TO "anon";
GRANT ALL ON TABLE "public"."mock_interview_question_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."mock_interview_question_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."referral_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."referral_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."resume_detail_items" TO "anon";
GRANT ALL ON TABLE "public"."resume_detail_items" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_detail_items" TO "service_role";



GRANT ALL ON TABLE "public"."resume_edits" TO "anon";
GRANT ALL ON TABLE "public"."resume_edits" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_edits" TO "service_role";



GRANT ALL ON TABLE "public"."resume_item_descriptions" TO "anon";
GRANT ALL ON TABLE "public"."resume_item_descriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_item_descriptions" TO "service_role";



GRANT ALL ON TABLE "public"."resume_list_items" TO "anon";
GRANT ALL ON TABLE "public"."resume_list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_list_items" TO "service_role";



GRANT ALL ON TABLE "public"."resume_metadata" TO "anon";
GRANT ALL ON TABLE "public"."resume_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_metadata" TO "service_role";



GRANT ALL ON TABLE "public"."resume_sections" TO "anon";
GRANT ALL ON TABLE "public"."resume_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_sections" TO "service_role";



GRANT ALL ON TABLE "public"."resumes" TO "anon";
GRANT ALL ON TABLE "public"."resumes" TO "authenticated";
GRANT ALL ON TABLE "public"."resumes" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_files" TO "anon";
GRANT ALL ON TABLE "public"."user_files" TO "authenticated";
GRANT ALL ON TABLE "public"."user_files" TO "service_role";



GRANT ALL ON TABLE "public"."user_knowledge_base" TO "anon";
GRANT ALL ON TABLE "public"."user_knowledge_base" TO "authenticated";
GRANT ALL ON TABLE "public"."user_knowledge_base" TO "service_role";



GRANT ALL ON TABLE "public"."user_knowledge_base_conversations" TO "anon";
GRANT ALL ON TABLE "public"."user_knowledge_base_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_knowledge_base_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."user_knowledge_base_messages" TO "anon";
GRANT ALL ON TABLE "public"."user_knowledge_base_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."user_knowledge_base_messages" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
