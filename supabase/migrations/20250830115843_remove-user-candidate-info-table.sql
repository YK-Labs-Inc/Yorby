drop policy "Enable all for users based on user_id" on "public"."user_candidate_info";

revoke delete on table "public"."user_candidate_info" from "anon";

revoke insert on table "public"."user_candidate_info" from "anon";

revoke references on table "public"."user_candidate_info" from "anon";

revoke select on table "public"."user_candidate_info" from "anon";

revoke trigger on table "public"."user_candidate_info" from "anon";

revoke truncate on table "public"."user_candidate_info" from "anon";

revoke update on table "public"."user_candidate_info" from "anon";

revoke delete on table "public"."user_candidate_info" from "authenticated";

revoke insert on table "public"."user_candidate_info" from "authenticated";

revoke references on table "public"."user_candidate_info" from "authenticated";

revoke select on table "public"."user_candidate_info" from "authenticated";

revoke trigger on table "public"."user_candidate_info" from "authenticated";

revoke truncate on table "public"."user_candidate_info" from "authenticated";

revoke update on table "public"."user_candidate_info" from "authenticated";

revoke delete on table "public"."user_candidate_info" from "service_role";

revoke insert on table "public"."user_candidate_info" from "service_role";

revoke references on table "public"."user_candidate_info" from "service_role";

revoke select on table "public"."user_candidate_info" from "service_role";

revoke trigger on table "public"."user_candidate_info" from "service_role";

revoke truncate on table "public"."user_candidate_info" from "service_role";

revoke update on table "public"."user_candidate_info" from "service_role";

alter table "public"."user_candidate_info" drop constraint "user_candidate_info_id_fkey";

alter table "public"."user_candidate_info" drop constraint "user_candidate_info_pkey";

drop index if exists "public"."user_candidate_info_pkey";

drop table "public"."user_candidate_info";


