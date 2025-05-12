create table "public"."coach_knowledge_base" (
    "coach_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "knowledge_base" text not null
);


alter table "public"."coach_knowledge_base" enable row level security;

CREATE UNIQUE INDEX coach_knowledge_base_pkey ON public.coach_knowledge_base USING btree (coach_id);

alter table "public"."coach_knowledge_base" add constraint "coach_knowledge_base_pkey" PRIMARY KEY using index "coach_knowledge_base_pkey";

alter table "public"."coach_knowledge_base" add constraint "coach_knowledge_base_coach_id_fkey" FOREIGN KEY (coach_id) REFERENCES coaches(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."coach_knowledge_base" validate constraint "coach_knowledge_base_coach_id_fkey";

grant delete on table "public"."coach_knowledge_base" to "anon";

grant insert on table "public"."coach_knowledge_base" to "anon";

grant references on table "public"."coach_knowledge_base" to "anon";

grant select on table "public"."coach_knowledge_base" to "anon";

grant trigger on table "public"."coach_knowledge_base" to "anon";

grant truncate on table "public"."coach_knowledge_base" to "anon";

grant update on table "public"."coach_knowledge_base" to "anon";

grant delete on table "public"."coach_knowledge_base" to "authenticated";

grant insert on table "public"."coach_knowledge_base" to "authenticated";

grant references on table "public"."coach_knowledge_base" to "authenticated";

grant select on table "public"."coach_knowledge_base" to "authenticated";

grant trigger on table "public"."coach_knowledge_base" to "authenticated";

grant truncate on table "public"."coach_knowledge_base" to "authenticated";

grant update on table "public"."coach_knowledge_base" to "authenticated";

grant delete on table "public"."coach_knowledge_base" to "service_role";

grant insert on table "public"."coach_knowledge_base" to "service_role";

grant references on table "public"."coach_knowledge_base" to "service_role";

grant select on table "public"."coach_knowledge_base" to "service_role";

grant trigger on table "public"."coach_knowledge_base" to "service_role";

grant truncate on table "public"."coach_knowledge_base" to "service_role";

grant update on table "public"."coach_knowledge_base" to "service_role";


