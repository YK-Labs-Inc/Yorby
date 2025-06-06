revoke delete on table "public"."coach_knowledge_base" from "anon";

revoke insert on table "public"."coach_knowledge_base" from "anon";

revoke references on table "public"."coach_knowledge_base" from "anon";

revoke select on table "public"."coach_knowledge_base" from "anon";

revoke trigger on table "public"."coach_knowledge_base" from "anon";

revoke truncate on table "public"."coach_knowledge_base" from "anon";

revoke update on table "public"."coach_knowledge_base" from "anon";

revoke delete on table "public"."coach_knowledge_base" from "authenticated";

revoke insert on table "public"."coach_knowledge_base" from "authenticated";

revoke references on table "public"."coach_knowledge_base" from "authenticated";

revoke select on table "public"."coach_knowledge_base" from "authenticated";

revoke trigger on table "public"."coach_knowledge_base" from "authenticated";

revoke truncate on table "public"."coach_knowledge_base" from "authenticated";

revoke update on table "public"."coach_knowledge_base" from "authenticated";

revoke delete on table "public"."coach_knowledge_base" from "service_role";

revoke insert on table "public"."coach_knowledge_base" from "service_role";

revoke references on table "public"."coach_knowledge_base" from "service_role";

revoke select on table "public"."coach_knowledge_base" from "service_role";

revoke trigger on table "public"."coach_knowledge_base" from "service_role";

revoke truncate on table "public"."coach_knowledge_base" from "service_role";

revoke update on table "public"."coach_knowledge_base" from "service_role";

alter table "public"."coach_knowledge_base" drop constraint "coach_knowledge_base_coach_id_fkey";

alter table "public"."coach_knowledge_base" drop constraint "coach_knowledge_base_pkey";

drop index if exists "public"."coach_knowledge_base_pkey";

drop table "public"."coach_knowledge_base";


