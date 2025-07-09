alter table "public"."mock_interview_google_storage_metadata" alter column "raw_bucket" drop not null;

alter table "public"."mock_interview_google_storage_metadata" alter column "raw_file_path" drop not null;

alter table "public"."mock_interview_google_storage_metadata" alter column "transcoded_bucket" drop not null;

alter table "public"."mock_interview_google_storage_metadata" alter column "transcoded_file_path" drop not null;


